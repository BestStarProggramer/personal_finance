from functools import lru_cache
from pathlib import Path

from pydantic import Field
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
