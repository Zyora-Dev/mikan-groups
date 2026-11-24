from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel, UniqueConstraint


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ProjectRole(StrEnum):
    """What someone does on a project. Lead is the single point of contact."""

    LEAD = "lead"
    ENGINEER = "engineer"
    DETAILER = "detailer"
    CHECKER = "checker"
    COORDINATOR = "coordinator"
    SUPPORT = "support"


class ProjectMember(SQLModel, table=True):
    """A person on a project.

    Many members per project, many projects per member. The unique
    constraint stops the same person being added twice.
    """

    __tablename__ = "project_member"
    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    project_id: UUID = Field(foreign_key="project.id", index=True)
    user_id: UUID = Field(foreign_key="app_user.id", index=True)

    role: ProjectRole = Field(default=ProjectRole.ENGINEER, index=True)
    note: str | None = Field(default=None, max_length=250)

    added_by_id: UUID | None = Field(default=None, foreign_key="app_user.id")
    created_at: datetime = Field(default_factory=utcnow)
