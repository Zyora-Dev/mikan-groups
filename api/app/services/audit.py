"""Audit recording.

`record` is deliberately cheap and never raises: an audit write must not
be able to fail the action it is describing.
"""

from uuid import UUID

from sqlmodel import Session

from app.models.audit import AuditAction, AuditLog
from app.models.user import User


def record(
    session: Session,
    *,
    actor: User,
    action: AuditAction,
    entity_type: str,
    entity_label: str,
    entity_id: UUID | None = None,
    organisation_id: UUID | None = None,
    project_id: UUID | None = None,
    field: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    detail: str | None = None,
) -> None:
    """Add an audit row to the open session. The caller commits."""
    try:
        session.add(AuditLog(
            organisation_id=organisation_id,
            actor_id=actor.id,
            actor_name=actor.full_name,
            actor_is_client=not actor.is_internal,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label[:250],
            field=field,
            old_value=str(old_value)[:250] if old_value is not None else None,
            new_value=str(new_value)[:250] if new_value is not None else None,
            detail=detail[:1000] if detail else None,
            project_id=project_id,
        ))
    except Exception:  # noqa: BLE001 — never break the action being logged
        pass
