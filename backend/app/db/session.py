from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import URL, Engine, create_engine
from sqlalchemy.orm import Session

from app.core.config import get_settings


def get_database_url() -> URL:
    settings = get_settings()
    return URL.create(
        "postgresql+psycopg", username=settings.db_user,
        password=settings.db_password.get_secret_value(),
        host=settings.db_host, port=settings.db_port, database=settings.db_name,
    )


@lru_cache
def get_engine() -> Engine:
    return create_engine(
        get_database_url(), pool_pre_ping=True, hide_parameters=True,
        connect_args={"connect_timeout": 5},
    )


def get_session() -> Generator[Session, None, None]:
    with Session(get_engine(), expire_on_commit=False) as session:
        yield session
