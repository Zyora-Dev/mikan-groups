from datetime import date, datetime, timezone
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ClientType(StrEnum):
    MAIN_CONTRACTOR = "main_contractor"
    FABRICATOR = "fabricator"
    EPC = "epc"
    DEVELOPER = "developer"
    CONSULTANCY = "consultancy"
    AUTHORITY = "authority"
    OTHER = "other"


class ContractingEntity(StrEnum):
    SINGAPORE = "singapore"
    IRELAND = "ireland"
    INDIA = "india"


class ClientStatus(StrEnum):
    PROSPECT = "prospect"
    ACTIVE = "active"
    DORMANT = "dormant"
    ARCHIVED = "archived"


class Organisation(SQLModel, table=True):
    """A client company. Mikan itself is the single internal organisation."""

    __tablename__ = "organisation"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # --- identity ---
    name: str = Field(index=True, max_length=200)           # legal name
    trading_name: str | None = Field(default=None, max_length=200)
    slug: str = Field(unique=True, index=True, max_length=120)
    registration_no: str | None = Field(default=None, max_length=80)
    tax_no: str | None = Field(default=None, max_length=80)  # VAT / GST
    website: str | None = Field(default=None, max_length=200)

    # --- classification ---
    client_type: ClientType = Field(default=ClientType.OTHER, index=True)
    sector: str | None = Field(default=None, max_length=120)
    default_standard: str | None = Field(default=None, max_length=60)

    # --- address ---
    country: str | None = Field(default=None, max_length=80, index=True)
    city: str | None = Field(default=None, max_length=120)
    address_line1: str | None = Field(default=None, max_length=200)
    address_line2: str | None = Field(default=None, max_length=200)
    postcode: str | None = Field(default=None, max_length=30)
    timezone: str | None = Field(default=None, max_length=60)

    # --- relationship ---
    contracting_entity: ContractingEntity = Field(
        default=ContractingEntity.SINGAPORE, index=True
    )
    contact_name: str | None = Field(default=None, max_length=150)
    contact_email: str | None = Field(default=None, max_length=254)
    contact_phone: str | None = Field(default=None, max_length=40)

    # --- internal ---
    account_manager_id: UUID | None = Field(
        default=None, foreign_key="app_user.id", index=True
    )
    status: ClientStatus = Field(default=ClientStatus.PROSPECT, index=True)
    nda_signed: bool = Field(default=False)
    nda_signed_on: date | None = Field(default=None)
    onboarded_on: date | None = Field(default=None)
    notes: str | None = Field(default=None, max_length=4000)

    # Marks the Mikan org; everything else is a client tenant.
    is_internal: bool = Field(default=False, index=True)
    is_active: bool = Field(default=True)

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
