from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AuditAction(StrEnum):
    CREATED = "created"
    UPDATED = "updated"
    DELETED = "deleted"
    STATUS_CHANGED = "status_changed"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"
    ASSIGNED = "assigned"
    MEMBER_ADDED = "member_added"
    MEMBER_REMOVED = "member_removed"
    FILE_ADDED = "file_added"
    FILE_REMOVED = "file_removed"
    COMMENTED = "commented"
    SIGNED_IN = "signed_in"
    ACCESS_GRANTED = "access_granted"
    ACCESS_REVOKED = "access_revoked"
    PASSWORD_RESET = "password_reset"


class AuditLog(SQLModel, table=True):
    """An immutable record of who did what, and when.

    Rows are never updated or deleted — the register's value is that it
    can be trusted when a client asks why something was built wrong.
    """

    __tablename__ = "audit_log"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Tenant the event belongs to. Null for internal-only actions.
    organisation_id: UUID | None = Field(
        default=None, foreign_key="organisation.id", index=True
    )

    actor_id: UUID | None = Field(default=None, foreign_key="app_user.id", index=True)
    actor_name: str = Field(max_length=150)       # kept even if the account goes
    actor_is_client: bool = Field(default=False)

    action: AuditAction = Field(index=True)
    entity_type: str = Field(max_length=40, index=True)   # task, project, client…
    entity_id: UUID | None = Field(default=None, index=True)
    entity_label: str = Field(max_length=250)             # readable at a glance

    # What actually changed, for status and assignment moves.
    field: str | None = Field(default=None, max_length=60)
    old_value: str | None = Field(default=None, max_length=250)
    new_value: str | None = Field(default=None, max_length=250)
    detail: str | None = Field(default=None, max_length=1000)

    project_id: UUID | None = Field(default=None, foreign_key="project.id", index=True)

    created_at: datetime = Field(default_factory=utcnow, index=True)
