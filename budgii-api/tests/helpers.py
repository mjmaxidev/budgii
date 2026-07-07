from uuid import uuid4

from fastapi.testclient import TestClient


def unique_email(label: str) -> str:
    return f"{label}-{uuid4().hex}@budgii.testmail.com"


def register_user(client: TestClient, label: str = "user") -> dict:
    email = unique_email(label)
    response = client.post(
        "/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "name": label.title(),
        },
    )
    assert response.status_code == 200, response.text
    tokens = response.json()
    tokens["email"] = email
    return tokens


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


def create_invite(
    client: TestClient,
    tokens: dict,
    household_id: str,
    role: str = "viewer",
    editor_level: str | None = None,
) -> dict:
    response = client.post(
        "/v1/households/invites",
        json={
            "household_id": household_id,
            "contact": unique_email("invite"),
            "access_role": role,
            "editor_level": editor_level,
        },
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def join_household(client: TestClient, tokens: dict, code: str) -> dict:
    response = client.post(
        "/v1/households/join",
        json={"code": code},
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def list_members(client: TestClient, tokens: dict, household_id: str) -> list[dict]:
    response = client.get(
        f"/v1/households/{household_id}/members",
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()["members"]


def bootstrap(client: TestClient, tokens: dict, household_id: str):
    return client.get(
        f"/v1/households/{household_id}/bootstrap",
        headers=auth_headers(tokens),
    )
