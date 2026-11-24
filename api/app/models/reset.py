"""Password reset tokens.

The token is emailed in the clear but stored only as a hash, so a copy
of the table cannot be used to take over accounts. Each row is usable
once: `used_at` is stamped on redemption, and issuing a new token
invalidates any earlier unused ones for that user.
"""

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PasswordReset(SQLModel, table=True):
    __tablename__ = "password_reset"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="app_user.id", index=True)

    # sha256 of the emailed token — never the token itself
    token_hash: str = Field(max_length=64, unique=True, index=True)

    expires_at: datetime
    used_at: datetime | None = Field(default=None)

    # Recorded for the audit trail; both are client-supplied and only
    # ever displayed, never trusted for a decision.
    requested_ip: str | None = Field(default=None, max_length=64)
    requested_agent: str | None = Field(default=None, max_length=250)

    created_at: datetime = Field(default_factory=utcnow)
