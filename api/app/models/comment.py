from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Comment(SQLModel, table=True):
    __tablename__ = "comment"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    task_id: UUID = Field(foreign_key="task.id", index=True)
    organisation_id: UUID = Field(foreign_key="organisation.id", index=True)

    body: str = Field(max_length=6000)

    author_id: UUID = Field(foreign_key="app_user.id", index=True)
    from_client: bool = Field(default=False, index=True)

    # Set when a comment accompanies a verdict, so the reason is kept
    # alongside the decision rather than lost in the thread.
    is_verdict_note: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utcnow, index=True)
    edited_at: datetime | None = Field(default=None)
