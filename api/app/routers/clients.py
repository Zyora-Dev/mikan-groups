"""Client organisations.

Internal staff only. Clients never reach these routes — they see their own
organisation through the client portal, not this list.
"""

import re
from datetime import date, datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.deps import AdminUser, InternalUser
from app.models.organisation import ClientStatus, ClientType, Organisation
from app.models.user import User
from app.schemas.client import (
    ClientCreate,
    ClientDetail,
    ClientSummary,
    ClientUpdate,
)

router = APIRouter(prefix="/clients", tags=["clients"])


def make_slug(session: Session, name: str) -> str:
    """URL-safe identifier, suffixed if the base is taken."""
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:100] or "client"
    slug, n = base, 1
    while session.exec(select(Organisation).where(Organisation.slug == slug)).first():
        n += 1
        slug = f"{base}-{n}"
    return slug


def _user_counts(session: Session) -> dict[UUID, int]:
    rows = session.exec(
        select(User.organisation_id, func.count(User.id)).group_by(User.organisation_id)  # type: ignore[arg-type]
    ).all()
    return {org_id: count for org_id, count in rows}


def _get_client(session: Session, client_id: UUID) -> Organisation:
    org = session.get(Organisation, client_id)
    if not org or org.is_internal:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client not found")
    return org


@router.get("", response_model=list[ClientSummary])
def list_clients(
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
    search: Annotated[str | None, Query(max_length=120)] = None,
    status_filter: Annotated[ClientStatus | None, Query(alias="status")] = None,
    client_type: ClientType | None = None,
) -> list[ClientSummary]:
    stmt = select(Organisation).where(Organisation.is_internal == False)  # noqa: E712

    if search:
        term = f"%{search.lower()}%"
        stmt = stmt.where(
            func.lower(Organisation.name).like(term)  # type: ignore[arg-type]
            | func.lower(func.coalesce(Organisation.trading_name, "")).like(term)
        )
    if status_filter:
        stmt = stmt.where(Organisation.status == status_filter)
    if client_type:
        stmt = stmt.where(Organisation.client_type == client_type)

    orgs = session.exec(stmt.order_by(Organisation.name)).all()  # type: ignore[arg-type]
    counts = _user_counts(session)

    return [
        ClientSummary.model_validate(o).model_copy(
            update={"user_count": counts.get(o.id, 0)}
        )
        for o in orgs
    ]


@router.post("", response_model=ClientDetail, status_code=status.HTTP_201_CREATED)
def create_client(
    body: ClientCreate,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> ClientDetail:
    name = body.name.strip()

    existing = session.exec(
        select(Organisation).where(
            func.lower(Organisation.name) == name.lower(),  # type: ignore[arg-type]
            Organisation.is_internal == False,  # noqa: E712
        )
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A client with that name already exists")

    org = Organisation(
        name=name,
        slug=make_slug(session, name),
        client_type=body.client_type,
        country=body.country.strip(),
        contracting_entity=body.contracting_entity,
        contact_email=body.contact_email,
        default_standard=body.default_standard,
        status=ClientStatus.PROSPECT,
        onboarded_on=date.today(),
        account_manager_id=admin.id,
        is_internal=False,
    )
    session.add(org)
    session.commit()
    session.refresh(org)
    return ClientDetail.model_validate(org)


@router.get("/{client_id}", response_model=ClientDetail)
def get_client(
    client_id: UUID,
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> ClientDetail:
    org = _get_client(session, client_id)
    count = session.exec(
        select(func.count()).select_from(User).where(User.organisation_id == org.id)
    ).one()
    return ClientDetail.model_validate(org).model_copy(update={"user_count": count})


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: UUID,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    """Permanently remove a client.

    Only allowed while the record is empty. Once people or project history
    exist, archive instead — deleting would break the audit trail.
    """
    org = _get_client(session, client_id)

    users = session.exec(
        select(func.count()).select_from(User).where(User.organisation_id == org.id)
    ).one()
    if users:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"{org.name} has {users} user account(s). Remove them first, or archive the client.",
        )

    session.delete(org)
    session.commit()


@router.patch("/{client_id}", response_model=ClientDetail)
def update_client(
    client_id: UUID,
    body: ClientUpdate,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> ClientDetail:
    org = _get_client(session, client_id)
    data = body.model_dump(exclude_unset=True)

    if "name" in data and data["name"]:
        data["name"] = data["name"].strip()

    # NDA date and flag should not contradict each other.
    if data.get("nda_signed") is True and not (data.get("nda_signed_on") or org.nda_signed_on):
        data["nda_signed_on"] = date.today()
    if data.get("nda_signed") is False:
        data["nda_signed_on"] = None

    for field, value in data.items():
        setattr(org, field, value)
    org.updated_at = datetime.now(timezone.utc)

    session.add(org)
    session.commit()
    session.refresh(org)
    return ClientDetail.model_validate(org)
