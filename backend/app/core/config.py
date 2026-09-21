from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8-sig",
        env_prefix="FINANCE_",
        extra="forbid",
    )

    app_name: str = Field(default="Personal Finance API", min_length=1)
    debug: bool = False
    db_host: str = "127.0.0.1"
    db_port: int = Field(default=5432, ge=1, le=65535)
    db_name: str = "personal_finance"
    db_user: str = "finance_app"
    db_password: SecretStr = SecretStr("")


@lru_cache
def get_settings() -> Settings:
    return Settings()
