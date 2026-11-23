from datetime import datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(StrEnum):
    # Mikan staff
    ADMIN = "admin"          # manages orgs, users and every project
    ENGINEER = "engineer"    # issues and checks drawings
    # Client staff
    CLIENT_ADMIN = "client_admin"  # manages their own org's users
    CLIENT = "client"              # views and comments


INTERNAL_ROLES = {UserRole.ADMIN, UserRole.ENGINEER}


class User(SQLModel, table=True):
    __tablename__ = "app_user"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=254)
    hashed_password: str = Field(max_length=255)

    full_name: str = Field(max_length=150)
    job_title: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=40)

    role: UserRole = Field(default=UserRole.CLIENT, index=True)

    # Every user belongs to exactly one organisation. This is the tenant key
    # that every downstream query must filter on.
    organisation_id: UUID = Field(foreign_key="organisation.id", index=True)

    is_active: bool = Field(default=True)
    must_change_password: bool = Field(default=True)

    # Brute-force protection
    failed_attempts: int = Field(default=0)
    locked_until: datetime | None = Field(default=None)
    last_login_at: datetime | None = Field(default=None)

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    @property
    def is_internal(self) -> bool:
        return self.role in INTERNAL_ROLES
