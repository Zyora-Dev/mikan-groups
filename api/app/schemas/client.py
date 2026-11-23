from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.organisation import ClientStatus, ClientType, ContractingEntity


class ClientCreate(BaseModel):
    """The short form used when onboarding. Everything else is edited later."""

    name: str = Field(min_length=2, max_length=200)
    client_type: ClientType
    country: str = Field(min_length=2, max_length=80)
    contracting_entity: ContractingEntity
    contact_email: EmailStr | None = None
    default_standard: str | None = Field(default=None, max_length=60)


class ClientUpdate(BaseModel):
    # identity
    name: str | None = Field(default=None, min_length=2, max_length=200)
    trading_name: str | None = Field(default=None, max_length=200)
    registration_no: str | None = Field(default=None, max_length=80)
    tax_no: str | None = Field(default=None, max_length=80)
    website: str | None = Field(default=None, max_length=200)
    # classification
    client_type: ClientType | None = None
    sector: str | None = Field(default=None, max_length=120)
    default_standard: str | None = Field(default=None, max_length=60)
    # address
    country: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, max_length=120)
    address_line1: str | None = Field(default=None, max_length=200)
    address_line2: str | None = Field(default=None, max_length=200)
    postcode: str | None = Field(default=None, max_length=30)
    timezone: str | None = Field(default=None, max_length=60)
    # relationship
    contracting_entity: ContractingEntity | None = None
    contact_name: str | None = Field(default=None, max_length=150)
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=40)
    # internal
    account_manager_id: UUID | None = None
    status: ClientStatus | None = None
    nda_signed: bool | None = None
    nda_signed_on: date | None = None
    onboarded_on: date | None = None
    notes: str | None = Field(default=None, max_length=4000)
    is_active: bool | None = None


class ClientSummary(BaseModel):
    """Row shape for the list screen."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    trading_name: str | None
    slug: str
    client_type: ClientType
    country: str | None
    contracting_entity: ContractingEntity
    status: ClientStatus
    sector: str | None
    nda_signed: bool
    is_active: bool
    user_count: int = 0
    created_at: datetime


class ClientDetail(ClientSummary):
    registration_no: str | None
    tax_no: str | None
    website: str | None
    default_standard: str | None
    city: str | None
    address_line1: str | None
    address_line2: str | None
    postcode: str | None
    timezone: str | None
    contact_name: str | None
    contact_email: str | None
    contact_phone: str | None
    account_manager_id: UUID | None
    nda_signed_on: date | None
    onboarded_on: date | None
    notes: str | None
    updated_at: datetime
