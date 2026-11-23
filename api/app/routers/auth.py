from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlmodel import Session, select

from app.core.config import get_settings
from app.core.db import get_session
from app.core.deps import CurrentUser
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
)
from app.models.organisation import Organisation
from app.models.user import INTERNAL_ROLES, User
from app.schemas.auth import (
    LoginRequest,
    OrganisationOut,
    PasswordChange,
    SessionOut,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# Deliberately identical for unknown email and wrong password, so the
# response can't be used to enumerate accounts.
BAD_CREDENTIALS = HTTPException(
    status.HTTP_401_UNAUTHORIZED, "Incorrect email or password"
)


def _set_auth_cookies(response: Response, user: User) -> None:
    access = create_access_token(user.id, user.organisation_id, user.role.value)
    refresh = create_refresh_token(user.id)
    secure = settings.is_production

    response.set_cookie(
        "access_token", access,
        httponly=True, secure=secure, samesite="lax",
        max_age=settings.access_token_minutes * 60, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh,
        httponly=True, secure=secure, samesite="lax",
        max_age=settings.refresh_token_days * 86400, path="/auth",
    )


@router.post("/login", response_model=SessionOut)
def login(
    body: LoginRequest,
    response: Response,
    request: Request,
    session: Annotated[Session, Depends(get_session)],
    internal: bool = False,
) -> SessionOut:
    """Sign in.

    `internal=true` is used by the team portal and rejects client accounts,
    so a client credential cannot be used against the internal interface.
    """
    now = datetime.now(timezone.utc)
    user = session.exec(select(User).where(User.email == body.email.lower())).first()

    if not user:
        raise BAD_CREDENTIALS

    if user.locked_until and user.locked_until > now:
        remaining = int((user.locked_until - now).total_seconds() // 60) + 1
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Account locked. Try again in {remaining} minute(s).",
        )

    if not verify_password(body.password, user.hashed_password):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_attempts = 0
        session.add(user)
        session.commit()
        raise BAD_CREDENTIALS

    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")

    # Team portal: refuse client credentials outright.
    if internal and user.role not in INTERNAL_ROLES:
        raise BAD_CREDENTIALS

    user.failed_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    session.add(user)
    session.commit()
    session.refresh(user)

    org = session.get(Organisation, user.organisation_id)
    if not org or not org.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Organisation is not active")

    _set_auth_cookies(response, user)
    return SessionOut(
        user=UserOut.model_validate(user),
        organisation=OrganisationOut.model_validate(org),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth")


@router.get("/me", response_model=SessionOut)
def me(
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> SessionOut:
    org = session.get(Organisation, user.organisation_id)
    if not org:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Organisation not found")
    return SessionOut(
        user=UserOut.model_validate(user),
        organisation=OrganisationOut.model_validate(org),
    )


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordChange,
    user: CurrentUser,
    session: Annotated[Session, Depends(get_session)],
) -> None:
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")

    user.hashed_password = hash_password(body.new_password)
    user.must_change_password = False
    user.updated_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
