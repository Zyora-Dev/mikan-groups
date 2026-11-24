from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.audit import AuditAction


class EmailSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider: str
    enabled: bool
    api_url: str
    # Never returned in full — the UI shows whether one is held.
    api_key_set: bool = False
    from_email: str | None
    from_name: str
    reply_to: str | None
    notify_on_submit: bool
    notify_on_verdict: bool
    notify_on_comment: bool
    notify_on_assignment: bool
    notify_on_task_created: bool
    last_tested_at: datetime | None
    last_test_ok: bool | None
    last_error: str | None
    updated_at: datetime


class EmailSettingsUpdate(BaseModel):
    enabled: bool | None = None
    api_url: str | None = Field(default=None, max_length=250)
    api_key: str | None = Field(default=None, max_length=500)
    from_email: EmailStr | None = None
    from_name: str | None = Field(default=None, max_length=150)
    reply_to: EmailStr | None = None
    notify_on_submit: bool | None = None
    notify_on_verdict: bool | None = None
    notify_on_comment: bool | None = None
    notify_on_assignment: bool | None = None
    notify_on_task_created: bool | None = None


class EmailTest(BaseModel):
    to_email: EmailStr


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    body: str | None
    entity_type: str
    entity_id: UUID | None
    project_id: UUID | None
    link: str | None
    read_at: datetime | None
    emailed_at: datetime | None
    created_at: datetime


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    actor_name: str
    actor_is_client: bool
    action: AuditAction
    entity_type: str
    entity_id: UUID | None
    entity_label: str
    field: str | None
    old_value: str | None
    new_value: str | None
    detail: str | None
    organisation_id: UUID | None
    client_name: str | None = None
    project_id: UUID | None
    created_at: datetime
