from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole

CLIENT_ASSIGNABLE = {UserRole.CLIENT_ADMIN, UserRole.CLIENT}


class ClientUserCreate(BaseModel):
    """Portal access for someone at a client organisation."""

    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    role: UserRole = UserRole.CLIENT_ADMIN
    job_title: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=40)

    @field_validator("role")
    @classmethod
    def role_must_be_client(cls, v: UserRole) -> UserRole:
        if v not in CLIENT_ASSIGNABLE:
            raise ValueError("Portal users must be a client admin or client")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if v.isalpha() or v.isdigit():
            raise ValueError("Use a mix of letters, numbers or symbols")
        return v


class ClientUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    job_title: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=40)
    role: UserRole | None = None
    is_active: bool | None = None

    @field_validator("role")
    @classmethod
    def role_must_be_client(cls, v: UserRole | None) -> UserRole | None:
        if v is not None and v not in CLIENT_ASSIGNABLE:
            raise ValueError("Portal users must be a client admin or client")
        return v


class ClientUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    role: UserRole
    job_title: str | None
    phone: str | None
    is_active: bool
    must_change_password: bool
    locked_until: datetime | None
    last_login_at: datetime | None
    created_at: datetime
