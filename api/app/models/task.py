from datetime import date, datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TaskStatus(StrEnum):
    """What the team is doing. Only internal users change this."""

    REQUESTED = "requested"      # raised by a client, not yet accepted
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"      # with the checker
    SUBMITTED = "submitted"      # issued to the client
    DONE = "done"


class ClientVerdict(StrEnum):
    """Whether the client accepts it. Only client users change this."""

    NONE = "none"                # nothing to judge yet
    AWAITING = "awaiting"        # submitted, client has not responded
    APPROVED = "approved"
    CHANGES_REQUESTED = "changes_requested"


class TaskPriority(StrEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Task(SQLModel, table=True):
    __tablename__ = "task"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id", index=True)

    # Denormalised so every task query can filter by tenant without a join.
    organisation_id: UUID = Field(foreign_key="organisation.id", index=True)

    title: str = Field(max_length=250)
    description: str | None = Field(default=None, max_length=6000)

    status: TaskStatus = Field(default=TaskStatus.TODO, index=True)
    verdict: ClientVerdict = Field(default=ClientVerdict.NONE, index=True)
    priority: TaskPriority = Field(default=TaskPriority.NORMAL, index=True)

    progress: int = Field(default=0, ge=0, le=100)
    due_date: date | None = Field(default=None, index=True)

    assignee_id: UUID | None = Field(default=None, foreign_key="app_user.id", index=True)
    checker_id: UUID | None = Field(default=None, foreign_key="app_user.id", index=True)

    # Distinguishes work we committed to from a client request.
    created_by_id: UUID | None = Field(default=None, foreign_key="app_user.id")
    raised_by_client: bool = Field(default=False, index=True)

    submitted_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
