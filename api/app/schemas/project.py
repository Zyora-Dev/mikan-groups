from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    job_number: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    discipline: str | None = Field(default=None, max_length=120)
    standard: str | None = Field(default=None, max_length=60)
    start_date: date | None = None
    target_date: date | None = None
    lead_engineer_id: UUID | None = None


class ProjectUpdate(BaseModel):
    job_number: str | None = Field(default=None, min_length=1, max_length=40)
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    discipline: str | None = Field(default=None, max_length=120)
    standard: str | None = Field(default=None, max_length=60)
    start_date: date | None = None
    target_date: date | None = None
    lead_engineer_id: UUID | None = None
    status: ProjectStatus | None = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organisation_id: UUID
    job_number: str
    title: str
    description: str | None
    discipline: str | None
    standard: str | None
    start_date: date | None
    target_date: date | None
    completed_on: date | None
    lead_engineer_id: UUID | None
    lead_engineer_name: str | None = None
    status: ProjectStatus
    created_at: datetime

    # computed
    member_count: int = 0
    member_names: list[str] = []
    task_count: int = 0
    done_count: int = 0
    progress: int = 0
    overdue_count: int = 0
    awaiting_client: int = 0


class ProjectMemberAdd(BaseModel):
    user_id: UUID
    role: str = "engineer"
    note: str | None = Field(default=None, max_length=250)


class ProjectMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    full_name: str = ""
    job_title: str | None = None
    account_role: str = ""
    role: str
    note: str | None
    created_at: datetime
