import pytest
from app.config import Settings


def test_production_rejects_default_jwt_secret() -> None:
    settings = Settings(
        app_env="production",
        app_debug=False,
        cors_origins="https://budgii.com.au",
        jwt_secret="change-me-in-production",
    )

    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        settings.validate_runtime()


def test_production_requires_cors_origins() -> None:
    settings = Settings(
        app_env="production",
        app_debug=False,
        cors_origins="",
        jwt_secret="a" * 32,
    )

    with pytest.raises(RuntimeError, match="CORS_ORIGINS"):
        settings.validate_runtime()


def test_cors_origins_are_trimmed() -> None:
    settings = Settings(cors_origins=" https://budgii.com.au, capacitor://localhost ,,")

    assert settings.cors_origin_list == ["https://budgii.com.au", "capacitor://localhost"]


def test_google_client_ids_are_trimmed() -> None:
    settings = Settings(google_client_id=" web-client, ios-client ,, android-client ")

    assert settings.google_client_ids == {"web-client", "ios-client", "android-client"}


def test_production_requires_email_key_when_provider_enabled() -> None:
    settings = Settings(
        app_env="production",
        app_debug=False,
        cors_origins="https://budgii.com.au",
        jwt_secret="a" * 32,
        invite_email_provider="resend",
        invite_email_from="Budgii <invites@budgii.com.au>",
        invite_email_api_key="",
    )

    with pytest.raises(RuntimeError, match="INVITE_EMAIL_API_KEY"):
        settings.validate_runtime()


def test_production_rejects_unknown_email_provider() -> None:
    settings = Settings(
        app_env="production",
        app_debug=False,
        cors_origins="https://budgii.com.au",
        jwt_secret="a" * 32,
        invite_email_provider="smtp",
    )

    with pytest.raises(RuntimeError, match="INVITE_EMAIL_PROVIDER"):
        settings.validate_runtime()


def test_production_requires_fcm_project_id() -> None:
    settings = Settings(
        app_env="production",
        app_debug=False,
        cors_origins="https://budgii.com.au",
        jwt_secret="a" * 32,
        push_provider="fcm",
    )

    with pytest.raises(RuntimeError, match="FCM_PROJECT_ID"):
        settings.validate_runtime()
