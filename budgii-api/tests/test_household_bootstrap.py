from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client


def unique_email(label: str) -> str:
    return f"{label}-{uuid4().hex}@budgii.testmail.com"


def register_user(client: TestClient, label: str = "user") -> dict:
    response = client.post(
        "/v1/auth/register",
        json={
            "email": unique_email(label),
            "password": "password123",
            "name": label.title(),
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def auth_headers(tokens: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def create_household(client: TestClient, tokens: dict, name: str = "Test Household") -> dict:
    response = client.post(
        "/v1/households",
        json={"name": name},
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def create_invite(client: TestClient, tokens: dict, household_id: str, role: str = "viewer") -> dict:
    response = client.post(
        "/v1/households/invites",
        json={
            "household_id": household_id,
            "contact": unique_email("invite"),
            "access_role": role,
            "editor_level": None,
        },
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def bootstrap(client: TestClient, tokens: dict, household_id: str):
    return client.get(
        f"/v1/households/{household_id}/bootstrap",
        headers=auth_headers(tokens),
    )


def test_admin_bootstrap_returns_household_graph_and_snapshot(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Admin Bootstrap")
    invite = create_invite(client, admin, household["id"], "viewer")

    response = bootstrap(client, admin, household["id"])

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["household"]["id"] == household["id"]
    assert body["household"]["access_role"] == "admin"
    assert len(body["members"]) == 1
    assert len(body["personas"]) == 1
    assert body["personas"][0]["has_app_access"] is True
    assert body["personas"][0]["access_role"] == "admin"
    assert [row["code"] for row in body["invites"]] == [invite["code"]]
    assert body["revision"] >= 1
    assert "categories" in body["snapshot"]
    assert "familyMembers" not in body["snapshot"]


def test_viewer_bootstrap_hides_invites_and_sync_push_is_read_only(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Viewer Bootstrap")
    invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "viewer")

    join_response = client.post(
        "/v1/households/join",
        json={"code": invite["code"]},
        headers=auth_headers(viewer),
    )
    assert join_response.status_code == 200, join_response.text

    response = bootstrap(client, viewer, household["id"])

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["household"]["access_role"] == "viewer"
    assert len(body["members"]) == 2
    assert len(body["personas"]) == 2
    assert body["invites"] == []
    assert "expenses" in body["snapshot"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": body["revision"],
            "changes": {"expenses": []},
        },
        headers=auth_headers(viewer),
    )

    assert push_response.status_code == 403
    assert push_response.json()["detail"] == "Read-only access"
