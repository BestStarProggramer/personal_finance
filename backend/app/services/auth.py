from datetime import timedelta
import secrets
from uuid import UUID

from fastapi import HTTPException
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import DUMMY_HASH, decode_access, encode_access, hash_refresh, password_hasher, utcnow
from app.models import Category, RefreshSession, User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenRead, UserRead

DEFAULT_CATEGORIES = {
    "income": ["Зарплата", "Подработка", "Подарки"],
    "expense": ["Продукты", "Транспорт", "Жильё", "Развлечения", "Здоровье"],
}


def unauthorized(message: str = "Сессия недействительна. Войдите снова.") -> HTTPException:
    return HTTPException(status_code=401, detail=message, headers={"WWW-Authenticate": "Bearer"})


def issue_tokens(session: Session, user: User, existing: RefreshSession | None = None) -> tuple[TokenRead, str]:
    settings = get_settings()
    raw = secrets.token_urlsafe(48)
    record = existing or RefreshSession(user_id=user.id, expires_at=utcnow() + timedelta(seconds=settings.refresh_token_seconds))
    record.token_hash = hash_refresh(raw)
    session.add(record)
    session.flush()
    access = encode_access(user.id, record.id)
    refresh_seconds = max(0, int((record.expires_at - utcnow()).total_seconds()))
    session.commit()
    return TokenRead(access_token=access, expires_in=settings.access_token_seconds, refresh_expires_in=refresh_seconds, user=UserRead.model_validate(user)), raw


def register(session: Session, data: RegisterRequest) -> tuple[TokenRead, str]:
    if session.scalar(select(User.id).where(User.email == data.email)) is not None:
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже зарегистрирован.")
    user = User(email=data.email, name=data.name, password_hash=password_hasher.hash(data.password.get_secret_value()))
    session.add(user)
    try:
        session.flush()
        session.add_all(Category(owner_id=user.id, name=name, type=kind) for kind, names in DEFAULT_CATEGORIES.items() for name in names)
        return issue_tokens(session, user)
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже зарегистрирован.") from error


def login(session: Session, data: LoginRequest) -> tuple[TokenRead, str]:
    user = session.scalar(select(User).where(User.email == data.email))
    stored_hash = user.password_hash if user is not None and user.is_active else DUMMY_HASH
    valid = password_hasher.verify(data.password.get_secret_value(), stored_hash)
    if not valid or user is None or not user.is_active:
        raise unauthorized("Неверный email или пароль.")
    return issue_tokens(session, user)


def refresh(session: Session, raw: str | None) -> tuple[TokenRead, str]:
    if raw is None or len(raw) > 256:
        raise unauthorized()
    record = session.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh(raw)).with_for_update())
    if record is None or record.revoked_at is not None or record.expires_at <= utcnow():
        raise unauthorized()
    user = session.get(User, record.user_id)
    if user is None or not user.is_active:
        raise unauthorized()
    return issue_tokens(session, user, record)


def current_user(session: Session, token: str) -> User:
    try:
        user_id, session_id = decode_access(token)
    except InvalidTokenError:
        raise unauthorized() from None
    record = session.get(RefreshSession, session_id)
    user = session.get(User, user_id)
    if record is None or record.user_id != user_id or record.revoked_at is not None or record.expires_at <= utcnow() or user is None or not user.is_active:
        raise unauthorized()
    return user


def logout(session: Session, raw: str | None, bearer: str | None) -> None:
    record = None
    if raw and len(raw) <= 256:
        record = session.scalar(select(RefreshSession).where(RefreshSession.token_hash == hash_refresh(raw)).with_for_update())
    if record is None and bearer:
        try:
            user_id, session_id = decode_access(bearer, verify_exp=False)
            record = session.scalar(select(RefreshSession).where(RefreshSession.id == session_id, RefreshSession.user_id == user_id).with_for_update())
        except InvalidTokenError:
            pass
    if record is not None:
        record.revoked_at = utcnow()
        session.commit()
