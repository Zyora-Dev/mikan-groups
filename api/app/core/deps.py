"""Auth dependencies.

`current_user` resolves the signed-in user. `require_internal` and
`require_admin` gate Mikan-only routes. Client-facing routes must scope
every query with `current_user.organisation_id` — see `tenant_scope`.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Cookie, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import decode_token
from app.models.user import INTERNAL_ROLES, User, UserRole

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
)


def current_user(
    session: Annotated[Session, Depends(get_session)],
    access_token: Annotated[str | None, Cookie()] = None,
) -> User:
    if not access_token:
        raise CREDENTIALS_ERROR

    payload = decode_token(access_token)
    if not payload:
        raise CREDENTIALS_ERROR

    try:
        user_id = UUID(payload["sub"])
    except (KeyError, ValueError):
        raise CREDENTIALS_ERROR from None

    user = session.get(User, user_id)
    if not user or not user.is_active:
        raise CREDENTIALS_ERROR
    return user


CurrentUser = Annotated[User, Depends(current_user)]


def require_internal(user: CurrentUser) -> User:
    """Mikan staff only — rejects client accounts."""
    if user.role not in INTERNAL_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Internal access only")
    return user


def require_admin(user: CurrentUser) -> User:
    if user.role is not UserRole.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Administrator access only")
    return user


InternalUser = Annotated[User, Depends(require_internal)]
AdminUser = Annotated[User, Depends(require_admin)]


def tenant_scope(user: CurrentUser) -> UUID | None:
    """The organisation a query must be limited to.

    Returns None for Mikan staff, who legitimately see every tenant.
    Client users always get their own organisation id — never a value
    supplied by the request.
    """
    return None if user.is_internal else user.organisation_id


TenantScope = Annotated[UUID | None, Depends(tenant_scope)]


def apply_scope(statement, model, scope: UUID | None):
    """Attach the tenant filter unless the caller is internal."""
    if scope is None:
        return statement
    return statement.where(model.organisation_id == scope)


__all__ = [
    "CurrentUser", "InternalUser", "AdminUser", "TenantScope",
    "current_user", "require_internal", "require_admin",
    "tenant_scope", "apply_scope", "select",
]
