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
    cors_origins: str = (
        "http://localhost:5173,http://localhost:5176,http://127.0.0.1:5173,http://127.0.0.1:5176"
    )

    database_url: str = "postgresql+asyncpg://budgii:budgii@localhost:5432/budgii"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    auth_rate_limit_enabled: bool = True
    auth_rate_limit_requests: int = 10
    auth_rate_limit_window_seconds: int = 60

    apple_client_id: str = ""
    google_client_id: str = ""
    openai_api_key: str = ""
    ai_insights_model: str = "gpt-5.4-mini"

    invite_link_base: str = "https://budgii.com.au/join"
    auth_link_base: str = "https://budgii.com.au"
    invite_email_provider: str = "log"
    invite_email_from: str = ""
    invite_email_api_key: str = ""
    receipt_storage_path: str = "/app/uploads"
    receipt_ocr_provider: str = "deterministic"
    receipt_openai_model: str = "gpt-5.5"
    push_provider: str = "log"
    fcm_project_id: str = ""

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def google_client_ids(self) -> set[str]:
        return {client_id.strip() for client_id in self.google_client_id.split(",") if client_id.strip()}

    def validate_runtime(self) -> None:
        if not self.is_production:
            return
        if self.jwt_secret in {
            "dev-secret-change-me",
            "dev-docker-secret-change-me",
            "change-me-in-production",
        }:
            raise RuntimeError("JWT_SECRET must be changed before running in production")
        if len(self.jwt_secret) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 characters in production")
        if not self.cors_origin_list:
            raise RuntimeError("CORS_ORIGINS must include the production frontend origin")
        invite_provider = self.invite_email_provider.strip().lower()
        if invite_provider not in {"log", "none", "resend", "sendgrid"}:
            raise RuntimeError("INVITE_EMAIL_PROVIDER must be log, none, resend, or sendgrid")
        if invite_provider not in {"log", "none"}:
            if not self.invite_email_from:
                raise RuntimeError("INVITE_EMAIL_FROM is required when invite email delivery is enabled")
            if not self.invite_email_api_key:
                raise RuntimeError("INVITE_EMAIL_API_KEY is required when invite email delivery is enabled")
        push_provider = self.push_provider.strip().lower()
        if push_provider not in {"log", "fcm"}:
            raise RuntimeError("PUSH_PROVIDER must be log or fcm")
        if push_provider == "fcm" and not self.fcm_project_id:
            raise RuntimeError("FCM_PROJECT_ID is required when PUSH_PROVIDER=fcm")


@lru_cache
def get_settings() -> Settings:
    return Settings()
