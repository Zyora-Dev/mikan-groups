from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Organisation(SQLModel, table=True):
    """A client company. Mikan itself is the single internal organisation."""

    __tablename__ = "organisation"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(index=True, max_length=200)
    slug: str = Field(unique=True, index=True, max_length=120)

    # Marks the Mikan org; everything else is a client tenant.
    is_internal: bool = Field(default=False, index=True)
    is_active: bool = Field(default=True)

    country: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=2000)

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
