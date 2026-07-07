import pytest

from app.config import Settings


def test_production_rejects_default_jwt_secret() -> None:
    settings = Settings(
        app_env="production",
        app_debug=False,
        cors_origins="https://budgii.app",
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
    settings = Settings(cors_origins=" https://budgii.app, capacitor://localhost ,,")

    assert settings.cors_origin_list == ["https://budgii.app", "capacitor://localhost"]
