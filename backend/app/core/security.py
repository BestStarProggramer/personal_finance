from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import UUID

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import get_settings

password_hasher = PasswordHash.recommended()
DUMMY_HASH = password_hasher.hash("dummy-credential-for-timing-only")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def hash_refresh(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def encode_access(user_id: UUID, session_id: UUID) -> str:
    settings = get_settings()
    now = utcnow()
    return jwt.encode({
        "sub": str(user_id), "sid": str(session_id), "iat": now,
        "exp": now + timedelta(seconds=settings.access_token_seconds),
        "iss": "personal-finance", "aud": "personal-finance-api", "type": "access",
    }, settings.jwt_secret.get_secret_value(), algorithm="HS256")


def decode_access(token: str, verify_exp: bool = True) -> tuple[UUID, UUID]:
    claims = jwt.decode(
        token, get_settings().jwt_secret.get_secret_value(), algorithms=["HS256"],
        issuer="personal-finance", audience="personal-finance-api",
        options={"require": ["sub", "sid", "iat", "exp", "iss", "aud", "type"], "verify_exp": verify_exp},
    )
    if claims["type"] != "access":
        raise InvalidTokenError("Invalid token type")
    try:
        return UUID(claims["sub"]), UUID(claims["sid"])
    except (ValueError, TypeError, AttributeError) as error:
        raise InvalidTokenError("Invalid token claims") from error
