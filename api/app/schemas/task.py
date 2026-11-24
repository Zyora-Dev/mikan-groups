from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import ClientVerdict, TaskPriority, TaskStatus
from app.models.attachment import AttachmentKind


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=250)
    description: str | None = Field(default=None, max_length=6000)
    due_date: date | None = None
    priority: TaskPriority = TaskPriority.NORMAL
    assignee_id: UUID | None = None
    checker_id: UUID | None = None


class TaskUpdate(BaseModel):
    """Internal edits. Clients use the verdict endpoint instead."""

    title: str | None = Field(default=None, min_length=2, max_length=250)
    description: str | None = Field(default=None, max_length=6000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    due_date: date | None = None
    assignee_id: UUID | None = None
    checker_id: UUID | None = None


class VerdictUpdate(BaseModel):
    verdict: ClientVerdict
    note: str | None = Field(default=None, max_length=6000)


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str
    description: str | None
    status: TaskStatus
    verdict: ClientVerdict
    priority: TaskPriority
    progress: int
    due_date: date | None
    assignee_id: UUID | None
    checker_id: UUID | None
    raised_by_client: bool
    submitted_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    comment_count: int = 0
    attachment_count: int = 0


class AttachmentCreate(BaseModel):
    label: str = Field(min_length=1, max_length=250)
    url: str = Field(min_length=4, max_length=1000)
    kind: AttachmentKind = AttachmentKind.DRAWING
    revision: str | None = Field(default=None, max_length=20)
    note: str | None = Field(default=None, max_length=1000)


class AttachmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    label: str
    url: str
    kind: AttachmentKind
    revision: str | None
    note: str | None
    uploaded_by_id: UUID | None
    from_client: bool
    created_at: datetime


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=6000)


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    body: str
    author_id: UUID
    author_name: str = ""
    from_client: bool
    is_verdict_note: bool
    created_at: datetime
    edited_at: datetime | None
