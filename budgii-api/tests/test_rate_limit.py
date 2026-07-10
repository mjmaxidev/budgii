from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import Settings
from app.rate_limit import add_auth_rate_limiting


def test_auth_rate_limit_blocks_repeated_post_requests() -> None:
    app = limited_app(limit=2)
    client = TestClient(app)

    assert client.post("/v1/auth/email").status_code == 200
    assert client.post("/v1/auth/email").status_code == 200

    blocked = client.post("/v1/auth/email")

    assert blocked.status_code == 429
    assert blocked.json()["detail"] == "Too many authentication attempts. Please try again later."
    assert blocked.headers["Retry-After"]


def test_auth_rate_limit_is_scoped_by_client_and_path() -> None:
    app = limited_app(limit=1)
    client = TestClient(app)

    assert client.post("/v1/auth/email", headers={"X-Forwarded-For": "10.0.0.1"}).status_code == 200
    assert client.post("/v1/auth/register", headers={"X-Forwarded-For": "10.0.0.1"}).status_code == 200
    assert client.post("/v1/auth/email", headers={"X-Forwarded-For": "10.0.0.2"}).status_code == 200
    assert client.post("/v1/auth/email", headers={"X-Forwarded-For": "10.0.0.1"}).status_code == 429


def test_auth_rate_limit_can_be_disabled() -> None:
    app = limited_app(limit=1, enabled=False)
    client = TestClient(app)

    assert client.post("/v1/auth/email").status_code == 200
    assert client.post("/v1/auth/email").status_code == 200


def limited_app(limit: int, enabled: bool = True) -> FastAPI:
    app = FastAPI()
    add_auth_rate_limiting(
        app,
        Settings(
            api_prefix="/v1",
            auth_rate_limit_enabled=enabled,
            auth_rate_limit_requests=limit,
            auth_rate_limit_window_seconds=60,
        ),
    )

    @app.post("/v1/auth/email")
    async def login() -> dict:
        return {"ok": True}

    @app.post("/v1/auth/register")
    async def register() -> dict:
        return {"ok": True}

    return app
