"""Email settings, notifications and the audit log."""

from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.deps import AdminUser, CurrentUser, InternalUser
from app.models.audit import AuditAction, AuditLog
from app.models.organisation import Organisation
from app.models.settings import Notification
from app.schemas.admin import (
    AuditOut,
    EmailSettingsOut,
    EmailSettingsUpdate,
    EmailTest,
    NotificationOut,
)
from app.services import email as email_service
from app.services.audit import record

router = APIRouter(tags=["admin"])


# ------------------------------------------------------- email settings


def _as_out(row) -> EmailSettingsOut:
    return EmailSettingsOut.model_validate(row).model_copy(
        update={"api_key_set": bool(row.api_key)}
    )


@router.get("/settings/email", response_model=EmailSettingsOut)
def get_email_settings(
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> EmailSettingsOut:
    return _as_out(email_service.get_settings_row(session))


@router.patch("/settings/email", response_model=EmailSettingsOut)
def update_email_settings(
    body: EmailSettingsUpdate,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> EmailSettingsOut:
    row = email_service.get_settings_row(session)
    data = body.model_dump(exclude_unset=True)

    # An empty key means "leave it alone", not "clear it".
    if data.get("api_key") == "":
        data.pop("api_key")

    if data.get("enabled") and not (data.get("api_key") or row.api_key):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Add a Send Mail token before switching email on",
        )
    if data.get("enabled") and not (data.get("from_email") or row.from_email):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Add a verified sender address before switching email on",
        )

    for field, value in data.items():
        setattr(row, field, value)
    row.updated_by_id = admin.id
    row.updated_at = datetime.now(timezone.utc)

    session.add(row)
    record(
        session, actor=admin, action=AuditAction.UPDATED,
        entity_type="settings", entity_label="Email settings",
        detail=", ".join(k for k in data if k != "api_key") or "api key",
    )
    session.commit()
    session.refresh(row)
    return _as_out(row)


@router.post("/settings/email/test", response_model=EmailSettingsOut)
def test_email(
    body: EmailTest,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> EmailSettingsOut:
    """Send one message and record whether it worked."""
    row = email_service.get_settings_row(session)
    if not row.api_key or not row.from_email:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Add a token and sender address first",
        )

    result = email_service.send(
        # Test regardless of the on/off switch, so it can be proven first.
        row.model_copy(update={"enabled": True}),
        to_email=body.to_email,
        to_name="Mikan test",
        subject="Mikan portal — test message",
        html=email_service.render(
            "Email is working",
            "This is a test from the Mikan portal. If you're reading it, "
            "notifications will reach your team and your clients.",
            None,
        ),
    )

    row.last_tested_at = datetime.now(timezone.utc)
    row.last_test_ok = result.ok
    row.last_error = result.error
    session.add(row)
    session.commit()
    session.refresh(row)
    return _as_out(row)


# -------------------------------------------------------- notifications


@router.get("/notifications", response_model=list[NotificationOut])
def list_notifications(
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
    unread_only: bool = False,
    limit: Annotated[int, Query(le=100)] = 30,
) -> list[Notification]:
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        stmt = stmt.where(Notification.read_at == None)  # noqa: E711
    return list(session.exec(
        stmt.order_by(Notification.created_at.desc()).limit(limit)  # type: ignore[attr-defined]
    ).all())


@router.get("/notifications/count")
def unread_count(
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> dict[str, int]:
    n = session.exec(
        select(func.count()).select_from(Notification).where(
            Notification.user_id == user.id,
            Notification.read_at == None,  # noqa: E711
        )
    ).one()
    return {"unread": n}


@router.post("/notifications/{notification_id}/read",
             status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    notification_id: UUID,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    note = session.get(Notification, notification_id)
    if not note or note.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    note.read_at = datetime.now(timezone.utc)
    session.add(note)
    session.commit()


@router.post("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    now = datetime.now(timezone.utc)
    for note in session.exec(
        select(Notification).where(
            Notification.user_id == user.id,
            Notification.read_at == None,  # noqa: E711
        )
    ).all():
        note.read_at = now
        session.add(note)
    session.commit()


# ------------------------------------------------------------ audit log


@router.get("/audit", response_model=list[AuditOut])
def list_audit(
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
    client_id: UUID | None = None,
    project_id: UUID | None = None,
    entity_id: UUID | None = None,
    action: AuditAction | None = None,
    limit: Annotated[int, Query(le=200)] = 60,
) -> list[AuditOut]:
    stmt = select(AuditLog)
    if client_id:
        stmt = stmt.where(AuditLog.organisation_id == client_id)
    if project_id:
        stmt = stmt.where(AuditLog.project_id == project_id)
    if entity_id:
        stmt = stmt.where(AuditLog.entity_id == entity_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)

    rows = session.exec(
        stmt.order_by(AuditLog.created_at.desc()).limit(limit)  # type: ignore[attr-defined]
    ).all()

    names = {
        o.id: o.name
        for o in session.exec(select(Organisation)).all()
    }
    return [
        AuditOut.model_validate(r).model_copy(
            update={"client_name": names.get(r.organisation_id) if r.organisation_id else None}
        )
        for r in rows
    ]
