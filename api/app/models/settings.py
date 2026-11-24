from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EmailSettings(SQLModel, table=True):
    """Outbound email configuration. One row.

    Holds Zoho ZeptoMail (CPaaS) credentials entered through the UI, so
    the service can be switched without a redeploy.
    """

    __tablename__ = "email_settings"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    provider: str = Field(default="zoho_zeptomail", max_length=40)
    enabled: bool = Field(default=False)

    # Zoho region decides the host: .com, .eu, .in, .com.au
    api_url: str = Field(
        default="https://api.zeptomail.com/v1.1/email", max_length=250
    )
    api_key: str | None = Field(default=None, max_length=500)  # Send Mail token

    from_email: str | None = Field(default=None, max_length=254)
    from_name: str = Field(default="Mikan Engineering", max_length=150)
    reply_to: str | None = Field(default=None, max_length=254)

    # Which events actually send.
    notify_on_submit: bool = Field(default=True)
    notify_on_verdict: bool = Field(default=True)
    notify_on_comment: bool = Field(default=True)
    notify_on_assignment: bool = Field(default=True)
    notify_on_task_created: bool = Field(default=False)

    last_tested_at: datetime | None = Field(default=None)
    last_test_ok: bool | None = Field(default=None)
    last_error: str | None = Field(default=None, max_length=500)

    updated_by_id: UUID | None = Field(default=None, foreign_key="app_user.id")
    updated_at: datetime = Field(default_factory=utcnow)


class Notification(SQLModel, table=True):
    """In-app notification. Email is a separate delivery of the same event."""

    __tablename__ = "notification"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="app_user.id", index=True)
    organisation_id: UUID | None = Field(
        default=None, foreign_key="organisation.id", index=True
    )

    title: str = Field(max_length=200)
    body: str | None = Field(default=None, max_length=1000)

    entity_type: str = Field(max_length=40)
    entity_id: UUID | None = Field(default=None)
    project_id: UUID | None = Field(default=None, foreign_key="project.id")
    link: str | None = Field(default=None, max_length=300)

    read_at: datetime | None = Field(default=None, index=True)
    emailed_at: datetime | None = Field(default=None)
    email_error: str | None = Field(default=None, max_length=300)

    created_at: datetime = Field(default_factory=utcnow, index=True)
