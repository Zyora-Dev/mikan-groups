"""Mikan staff accounts.

Every route here is admin-only and scoped to the internal organisation,
so a client administrator can never reach it even with a valid session.
"""

from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, func, select

from app.core.db import get_session
from app.core.deps import AdminUser, InternalUser
from app.core.security import hash_password
from app.models.user import INTERNAL_ROLES, User, UserRole
from app.schemas.user import (
    AssignableOut,
    PasswordReset,
    TeamMemberOut,
    UserCreate,
    UserUpdate,
)

router = APIRouter(prefix="/team/members", tags=["team"])


def _get_member(session: Session, admin: User, member_id: UUID) -> User:
    """Fetch a team member inside the caller's own organisation."""
    member = session.get(User, member_id)
    if (
        not member
        or member.organisation_id != admin.organisation_id
        or member.role not in INTERNAL_ROLES
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Team member not found")
    return member


def _other_active_admins(session: Session, admin: User, exclude: UUID) -> int:
    return session.exec(
        select(func.count())
        .select_from(User)
        .where(
            User.organisation_id == admin.organisation_id,
            User.role == UserRole.ADMIN,
            User.is_active == True,  # noqa: E712
            User.id != exclude,
        )
    ).one()


@router.get("", response_model=list[TeamMemberOut])
def list_members(
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[User]:
    return list(
        session.exec(
            select(User)
            .where(
                User.organisation_id == admin.organisation_id,
                User.role.in_(INTERNAL_ROLES),  # type: ignore[attr-defined]
            )
            .order_by(User.created_at.desc())  # type: ignore[attr-defined]
        ).all()
    )


@router.get("/assignable", response_model=list[AssignableOut])
def list_assignable(
    user: InternalUser,
    session: Annotated[Session, Depends(get_session)],
) -> list[User]:
    """Active staff who can own or check work.

    Any internal user may read this — engineers need it to populate an
    assignee picker — unlike the full member list, which is admin-only.
    """
    return list(
        session.exec(
            select(User)
            .where(
                User.organisation_id == user.organisation_id,
                User.role.in_(INTERNAL_ROLES),  # type: ignore[attr-defined]
                User.is_active == True,  # noqa: E712
            )
            .order_by(User.full_name)  # type: ignore[arg-type]
        ).all()
    )


@router.post("", response_model=TeamMemberOut, status_code=status.HTTP_201_CREATED)
def create_member(
    body: UserCreate,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> User:
    email = body.email.lower()

    if session.exec(select(User).where(User.email == email)).first():
        raise HTTPException(
            status.HTTP_409_CONFLICT, "An account with that email already exists"
        )

    member = User(
        email=email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name.strip(),
        job_title=body.job_title,
        phone=body.phone,
        role=body.role,
        organisation_id=admin.organisation_id,
        # The admin chose this password, not the user — force a change.
        must_change_password=True,
    )
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.patch("/{member_id}", response_model=TeamMemberOut)
def update_member(
    member_id: UUID,
    body: UserUpdate,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> User:
    member = _get_member(session, admin, member_id)
    data = body.model_dump(exclude_unset=True)

    # Guard against removing the last way back in.
    losing_admin = (
        data.get("role") is not None and data["role"] is not UserRole.ADMIN
    ) or data.get("is_active") is False

    if (
        member.role is UserRole.ADMIN
        and losing_admin
        and _other_active_admins(session, admin, member.id) == 0
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This is the only active administrator. Promote another first.",
        )

    if member.id == admin.id and data.get("is_active") is False:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "You cannot deactivate your own account"
        )

    for field, value in data.items():
        setattr(member, field, value)
    member.updated_at = datetime.now(timezone.utc)

    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.post("/{member_id}/password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(
    member_id: UUID,
    body: PasswordReset,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    member = _get_member(session, admin, member_id)
    member.hashed_password = hash_password(body.new_password)
    member.must_change_password = True
    member.failed_attempts = 0
    member.locked_until = None
    member.updated_at = datetime.now(timezone.utc)
    session.add(member)
    session.commit()


@router.post("/{member_id}/unlock", status_code=status.HTTP_204_NO_CONTENT)
def unlock_member(
    member_id: UUID,
    admin: AdminUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    member = _get_member(session, admin, member_id)
    member.failed_attempts = 0
    member.locked_until = None
    session.add(member)
    session.commit()
