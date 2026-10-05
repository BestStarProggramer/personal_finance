from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
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
    db_schema: str = Field(default="public", pattern=r"^[a-z][a-z0-9_]{0,62}$")
    jwt_secret: SecretStr
    access_token_seconds: int = Field(default=900, ge=1, le=86400)
    refresh_token_seconds: int = Field(default=604800, ge=60, le=2592000)
    cookie_secure: bool = False
    allowed_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"]

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, value: SecretStr) -> SecretStr:
        if len(value.get_secret_value().encode("utf-8")) < 32:
            raise ValueError("FINANCE_JWT_SECRET должен содержать не менее 32 байт.")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
