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

    join_household(client, viewer, invite["code"])

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


def test_admin_can_revoke_unused_invite_and_used_invite_is_locked(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Invite Admin")
    unused_invite = create_invite(client, admin, household["id"], "viewer")
    used_invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "viewer")
    join_household(client, viewer, used_invite["code"])

    revoke_response = client.delete(
        f"/v1/households/invites/{unused_invite['id']}",
        headers=auth_headers(admin),
    )

    assert revoke_response.status_code == 204

    list_response = client.get(
        f"/v1/households/invites?household_id={household['id']}",
        headers=auth_headers(admin),
    )
    assert list_response.status_code == 200, list_response.text
    remaining_codes = [invite["code"] for invite in list_response.json()["invites"]]
    assert unused_invite["code"] not in remaining_codes
    assert used_invite["code"] in remaining_codes

    used_revoke_response = client.delete(
        f"/v1/households/invites/{used_invite['id']}",
        headers=auth_headers(admin),
    )

    assert used_revoke_response.status_code == 410
    assert used_revoke_response.json()["detail"] == "Invite already used"


def test_non_admin_cannot_manage_invites_or_members(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Non Admin Guard")
    viewer_invite = create_invite(client, admin, household["id"], "viewer")
    unused_invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "viewer")
    join_household(client, viewer, viewer_invite["code"])

    list_response = client.get(
        f"/v1/households/invites?household_id={household['id']}",
        headers=auth_headers(viewer),
    )
    revoke_response = client.delete(
        f"/v1/households/invites/{unused_invite['id']}",
        headers=auth_headers(viewer),
    )
    members = list_members(client, admin, household["id"])
    viewer_member = next(member for member in members if member["email"] == viewer["email"])
    patch_response = client.patch(
        f"/v1/households/{household['id']}/members/{viewer_member['user_id']}",
        json={"access_role": "editor", "editor_level": "standard"},
        headers=auth_headers(viewer),
    )

    assert list_response.status_code == 403
    assert revoke_response.status_code == 403
    assert patch_response.status_code == 403


def test_admin_can_update_and_remove_member(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Member Admin")
    invite = create_invite(client, admin, household["id"], "editor")
    editor = register_user(client, "editor")
    join_household(client, editor, invite["code"])

    members = list_members(client, admin, household["id"])
    editor_member = next(member for member in members if member["email"] == editor["email"])

    update_response = client.patch(
        f"/v1/households/{household['id']}/members/{editor_member['user_id']}",
        json={"access_role": "viewer", "editor_level": None},
        headers=auth_headers(admin),
    )

    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["access_role"] == "viewer"
    assert update_response.json()["editor_level"] is None

    remove_response = client.delete(
        f"/v1/households/{household['id']}/members/{editor_member['user_id']}",
        headers=auth_headers(admin),
    )

    assert remove_response.status_code == 204
    assert len(list_members(client, admin, household["id"])) == 1

    removed_bootstrap_response = bootstrap(client, editor, household["id"])
    assert removed_bootstrap_response.status_code == 403
