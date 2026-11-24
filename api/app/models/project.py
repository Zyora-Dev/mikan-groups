from datetime import date, datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ProjectStatus(StrEnum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Project(SQLModel, table=True):
    __tablename__ = "project"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Tenant key. Every query must filter on this.
    organisation_id: UUID = Field(foreign_key="organisation.id", index=True)

    job_number: str = Field(index=True, max_length=40)
    title: str = Field(max_length=200)
    description: str | None = Field(default=None, max_length=4000)

    discipline: str | None = Field(default=None, max_length=120)
    standard: str | None = Field(default=None, max_length=60)

    start_date: date | None = Field(default=None)
    target_date: date | None = Field(default=None, index=True)
    completed_on: date | None = Field(default=None)

    lead_engineer_id: UUID | None = Field(
        default=None, foreign_key="app_user.id", index=True
    )
    status: ProjectStatus = Field(default=ProjectStatus.PLANNING, index=True)

    created_by_id: UUID | None = Field(default=None, foreign_key="app_user.id")
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
