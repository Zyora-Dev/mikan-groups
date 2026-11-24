from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class AttachmentKind(StrEnum):
    DRAWING = "drawing"
    MODEL = "model"
    MARKUP = "markup"        # client's commented file coming back
    REFERENCE = "reference"
    OTHER = "other"


class Attachment(SQLModel, table=True):
    """A pointer to a file in Mikan Cloud, not the file itself."""

    __tablename__ = "attachment"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    task_id: UUID = Field(foreign_key="task.id", index=True)
    organisation_id: UUID = Field(foreign_key="organisation.id", index=True)

    label: str = Field(max_length=250)
    url: str = Field(max_length=1000)
    kind: AttachmentKind = Field(default=AttachmentKind.DRAWING, index=True)
    revision: str | None = Field(default=None, max_length=20)
    note: str | None = Field(default=None, max_length=1000)

    uploaded_by_id: UUID | None = Field(default=None, foreign_key="app_user.id")
    from_client: bool = Field(default=False, index=True)

    created_at: datetime = Field(default_factory=utcnow)
