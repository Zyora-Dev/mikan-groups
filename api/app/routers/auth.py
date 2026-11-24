import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.db import get_session
from app.core.deps import CurrentUser
from app.core.ratelimit import enforce, reset as reset_limit
from app.core.security import (
    REFRESH,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.audit import AuditAction
from app.models.organisation import Organisation
from app.models.reset import PasswordReset
from app.models.user import INTERNAL_ROLES, User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    OrganisationOut,
    PasswordChange,
    ResetPasswordRequest,
    ResetTokenCheck,
    SessionOut,
    UserOut,
)
from app.services import audit as audit_service
from app.services import email as email_service

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# Deliberately identical for unknown email and wrong password, so the
# response can't be used to enumerate accounts.
BAD_CREDENTIALS = HTTPException(
    status.HTTP_401_UNAUTHORIZED, "Incorrect email or password"
)


# The refresh cookie is limited to the auth routes, so it is not sent on
# ordinary API calls. This must be the full mounted path — "/auth" alone
# never matches "/api/v1/auth/..." and the browser would withhold it.
REFRESH_PATH = "/api/v1/auth"


def _cookie_policy() -> dict:
    """Cross-site cookies need SameSite=None, which browsers only honour
    with Secure. In production the site and API are on different origins
    (Vercel and the API host), so lax would silently drop every cookie."""
    if settings.is_production:
        return {"secure": True, "samesite": "none"}
    return {"secure": False, "samesite": "lax"}


def _set_auth_cookies(response: Response, user: User) -> None:
    access = create_access_token(user.id, user.organisation_id, user.role.value)
    refresh = create_refresh_token(user.id)
    policy = _cookie_policy()

    response.set_cookie(
        "access_token", access, httponly=True, **policy,
        max_age=settings.access_token_minutes * 60, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, **policy,
        max_age=settings.refresh_token_days * 86400, path=REFRESH_PATH,
    )


@router.post("/login", response_model=SessionOut)
def login(
    body: LoginRequest,
    response: Response,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    internal: bool = False,
) -> SessionOut:
    """Sign in.

    `internal=true` is used by the team portal and rejects client accounts,
    so a client credential cannot be used against the internal interface.
    """
    # Per-account lockout below stops repeated guesses at one password.
    # This stops one address trying one guess against many accounts.
    enforce(request, bucket="login",
            limit=settings.login_rate_limit,
            window=settings.login_rate_window_seconds)

    now = datetime.now(timezone.utc)
    user = session.exec(select(User).where(User.email == body.email.lower())).first()

    if not user:
        raise BAD_CREDENTIALS

    if user.locked_until and user.locked_until > now:
        remaining = int((user.locked_until - now).total_seconds() // 60) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Account locked. Try again in {remaining} minute(s).",
        )

    if not verify_password(body.password, user.hashed_password):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_attempts = 0
        session.add(user)
        session.commit()
        raise BAD_CREDENTIALS

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")

    # Team portal: refuse client credentials outright.
    if internal and user.role not in INTERNAL_ROLES:
        raise BAD_CREDENTIALS

    user.failed_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    session.add(user)
    session.commit()
    session.refresh(user)

    org = session.get(Organisation, user.organisation_id)
    if not org or not org.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Organisation is not active")

    # A good sign-in shouldn't leave a shared office address near its cap.
    reset_limit("login", request)

    _set_auth_cookies(response, user)
    return SessionOut(
        user=UserOut.model_validate(user),
        organisation=OrganisationOut.model_validate(org),
    )


@router.post("/refresh", response_model=SessionOut)
def refresh(
    response: Response,
    session: Annotated[Session, Depends(get_session)],
    refresh_token: Annotated[str | None, Cookie()] = None,
) -> SessionOut:
    """Exchange the refresh cookie for a fresh access token.

    This is what makes a short access token workable: the browser can
    renew silently, and revoking an account stops the renewal, which a
    long-lived access token on its own could never do.
    """
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")

    payload = decode_token(refresh_token, expect=REFRESH)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")

    try:
        user = session.get(User, UUID(payload["sub"]))
    except (KeyError, ValueError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired") from None

    # Deactivating an account must end its sessions at the next renewal.
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired")

    org = session.get(Organisation, user.organisation_id)
    if not org or not org.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Organisation is not active")

    _set_auth_cookies(response, user)
    return SessionOut(
        user=UserOut.model_validate(user),
        organisation=OrganisationOut.model_validate(org),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    policy = _cookie_policy()
    response.delete_cookie("access_token", path="/", **policy)
    response.delete_cookie("refresh_token", path=REFRESH_PATH, **policy)


@router.get("/me", response_model=SessionOut)
def me(
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> SessionOut:
    org = session.get(Organisation, user.organisation_id)
    if not org:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return SessionOut(
        user=UserOut.model_validate(user),
        organisation=OrganisationOut.model_validate(org),
    )


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordChange,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")

    user.hashed_password = hash_password(body.new_password)
    user.must_change_password = False
    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()


# ------------------------------------------------------------ password reset

RESET_WINDOW = 3          # requests
RESET_WINDOW_SECONDS = 900

# Shown whatever happens, so the response cannot be used to learn which
# addresses have accounts.
RESET_SENT = {
    "detail": "If that address has an account, a reset link is on its way."
}


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


@router.post("/forgot-password")
def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, str]:
    """Send a reset link.

    Always reports success. Whether the address exists, whether the
    account is active, and whether email is configured are all invisible
    to the caller by design.
    """
    enforce(request, bucket="forgot",
            limit=RESET_WINDOW, window=RESET_WINDOW_SECONDS)

    user = session.exec(
        select(User).where(User.email == body.email.lower())
    ).first()

    if not user or not user.is_active:
        return RESET_SENT

    # A client must not be able to request a link into the internal app,
    # and vice versa — otherwise the team door is discoverable by email.
    wants_team = body.scope == "team"
    if wants_team is not (user.role in INTERNAL_ROLES):
        return RESET_SENT

    # Issuing a new link retires any earlier unused one.
    now = datetime.now(timezone.utc)
    for old in session.exec(
        select(PasswordReset).where(
            PasswordReset.user_id == user.id,
            PasswordReset.used_at == None,  # noqa: E711
        )
    ).all():
        old.used_at = now
        session.add(old)

    raw = secrets.token_urlsafe(32)
    session.add(PasswordReset(
        user_id=user.id,
        token_hash=_hash_token(raw),
        expires_at=now + timedelta(minutes=settings.reset_token_minutes),
        requested_ip=(request.client.host if request.client else None),
        requested_agent=(request.headers.get("user-agent") or "")[:250] or None,
    ))
    session.commit()

    path = "/internal/erp/team/reset" if wants_team else "/portal/reset"
    link = f"{settings.web_base_url}{path}?token={raw}"

    config = email_service.get_settings_row(session)
    email_service.send(
        config,
        to_email=user.email,
        to_name=user.full_name,
        subject="Reset your Mikan password",
        html=email_service.render(
            "Reset your password",
            (
                f"{user.full_name}, we received a request to reset the password "
                f"for {user.email}. This link works once and expires in "
                f"{settings.reset_token_minutes} minutes. "
                "If you didn't ask for it, you can ignore this message — "
                "your password stays as it is."
            ),
            link,
            action="Choose a new password",
        ),
    )

    audit_service.record(
        session, actor=user, action=AuditAction.PASSWORD_RESET,
        entity_type="user", entity_id=user.id,
        entity_label=user.full_name, detail="Reset link requested",
    )
    session.commit()
    return RESET_SENT


@router.get("/reset-password", response_model=ResetTokenCheck)
def check_reset_token(
    token: str,
    session: Annotated[Session, Depends(get_session)],
) -> ResetTokenCheck:
    """Tell the reset page whether the link is still good, before asking
    the person to type a new password into a form that cannot work."""
    row = session.exec(
        select(PasswordReset).where(PasswordReset.token_hash == _hash_token(token))
    ).first()

    if not row or row.used_at or row.expires_at < datetime.now(timezone.utc):
        return ResetTokenCheck(valid=False)

    user = session.get(User, row.user_id)
    if not user or not user.is_active:
        return ResetTokenCheck(valid=False)

    return ResetTokenCheck(
        valid=True,
        email=user.email,
        full_name=user.full_name,
        scope="team" if user.role in INTERNAL_ROLES else "portal",
    )


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(
    body: ResetPasswordRequest,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    enforce(request, bucket="reset",
            limit=10, window=RESET_WINDOW_SECONDS)

    row = session.exec(
        select(PasswordReset).where(PasswordReset.token_hash == _hash_token(body.token))
    ).first()

    now = datetime.now(timezone.utc)
    if not row or row.used_at or row.expires_at < now:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "That link has expired or has already been used. Request a new one.",
        )

    user = session.get(User, row.user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That link is no longer valid.")

    user.hashed_password = hash_password(body.new_password)
    # They have just proved control of the inbox, so no forced change.
    user.must_change_password = False
    # A reset is also the way out of a lockout.
    user.failed_attempts = 0
    user.locked_until = None
    user.updated_at = now
    session.add(user)

    row.used_at = now
    session.add(row)

    audit_service.record(
        session, actor=user, action=AuditAction.PASSWORD_RESET,
        entity_type="user", entity_id=user.id,
        entity_label=user.full_name, detail="Password reset via emailed link",
    )
    session.commit()
