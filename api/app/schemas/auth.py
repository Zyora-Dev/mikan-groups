from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class OrganisationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    is_internal: bool


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    job_title: str | None
    role: UserRole
    organisation_id: UUID
    must_change_password: bool
    last_login_at: datetime | None


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserOut
    organisation: OrganisationOut


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    # Which door they came through, so the link points at the right app.
    scope: str = Field(default="portal", pattern="^(portal|team)$")


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: str = Field(min_length=10, max_length=128)


class ResetTokenCheck(BaseModel):
    """What the reset page shows before accepting a new password."""

    valid: bool
    email: EmailStr | None = None
    full_name: str | None = None
    scope: str = "portal"
