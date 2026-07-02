from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_debug: bool = True
    api_prefix: str = "/v1"

    database_url: str = "postgresql+asyncpg://budgii:budgii@localhost:5432/budgii"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30

    apple_client_id: str = ""
    google_client_id: str = ""

    invite_link_base: str = "https://budgii.app/join"
    receipt_storage_path: str = "/app/uploads"


@lru_cache
def get_settings() -> Settings:
    return Settings()
