from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS = "access"
REFRESH = "refresh"


def hash_password(raw: str) -> str:
    return pwd_context.hash(raw)


def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


def _token(subject: UUID, kind: str, expires: timedelta, **claims: Any) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "type": kind,
        "iat": now,
        "exp": now + expires,
        **claims,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: UUID, org_id: UUID, role: str) -> str:
    return _token(
        user_id,
        ACCESS,
        timedelta(minutes=settings.access_token_minutes),
        org=str(org_id),
        role=role,
    )


def create_refresh_token(user_id: UUID) -> str:
    return _token(user_id, REFRESH, timedelta(days=settings.refresh_token_days))


def decode_token(token: str, expect: str = ACCESS) -> dict[str, Any] | None:
    """Returns the payload, or None if the token is invalid or the wrong kind."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
    if payload.get("type") != expect:
        return None
    return payload
