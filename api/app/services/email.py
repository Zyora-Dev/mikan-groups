"""Outbound email via Zoho ZeptoMail.

Credentials are held in the database rather than the environment, so an
administrator can change them through the UI without a redeploy. Sending
is best-effort: a failure is recorded against the notification and never
raises into the request that triggered it.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass

from sqlmodel import Session, select

from app.models.settings import EmailSettings

TIMEOUT = 12


@dataclass
class SendResult:
    ok: bool
    error: str | None = None


def get_settings_row(session: Session) -> EmailSettings:
    """The single settings row, created on first read."""
    row = session.exec(select(EmailSettings)).first()
    if not row:
        row = EmailSettings()
        session.add(row)
        session.commit()
        session.refresh(row)
    return row


def send(
    config: EmailSettings,
    *,
    to_email: str,
    to_name: str,
    subject: str,
    html: str,
) -> SendResult:
    """Post one message to ZeptoMail. Returns rather than raises."""
    if not config.enabled:
        return SendResult(False, "Email is switched off")
    if not config.api_key or not config.from_email:
        return SendResult(False, "Email is not configured")

    payload = {
        "from": {"address": config.from_email, "name": config.from_name},
        "to": [{"email_address": {"address": to_email, "name": to_name}}],
        "subject": subject,
        "htmlbody": html,
    }
    if config.reply_to:
        payload["reply_to"] = [{"address": config.reply_to}]

    request = urllib.request.Request(
        config.api_url,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            # ZeptoMail expects the token verbatim, already prefixed.
            "Authorization": config.api_key,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            if 200 <= response.status < 300:
                return SendResult(True)
            return SendResult(False, f"Provider returned {response.status}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode(errors="replace")[:200]
        return SendResult(False, f"{exc.code}: {body}")
    except urllib.error.URLError as exc:
        return SendResult(False, f"Could not reach the provider: {exc.reason}")
    except Exception as exc:  # noqa: BLE001
        return SendResult(False, str(exc)[:200])


def render(title: str, body: str, link: str | None, action: str | None = None) -> str:
    """A plain, readable message. No images, no tracking."""
    button = (
        f'<p style="margin:28px 0"><a href="{link}" '
        'style="background:#00A651;color:#fff;text-decoration:none;'
        'padding:12px 22px;border-radius:6px;font-weight:600;'
        f'display:inline-block">{action or "Open in the portal"}</a></p>'
        if link else ""
    )
    return f"""<!doctype html>
<html><body style="margin:0;background:#f5f6f7;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <p style="font-size:13px;font-weight:700;letter-spacing:.14em;
              text-transform:uppercase;color:#00A651;margin:0">
      Mikan Engineering
    </p>
    <h1 style="font-size:21px;line-height:1.3;color:#111;margin:14px 0 0">{title}</h1>
    <p style="font-size:15px;line-height:1.65;color:#444;margin:16px 0 0">{body}</p>
    {button}
    <p style="font-size:12px;line-height:1.6;color:#888;margin:28px 0 0;
              border-top:1px solid #e3e5e8;padding-top:18px">
      You're receiving this because you work on this project in the Mikan portal.
    </p>
  </div>
</body></html>"""
