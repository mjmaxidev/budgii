from fastapi.testclient import TestClient

from tests.helpers import auth_headers, create_household, register_user, unique_email


PASSWORD = "password123"


def login_email(client: TestClient, email: str, password: str = PASSWORD):
    return client.post(
        "/v1/auth/email",
        json={"email": email, "password": password},
    )


def refresh(client: TestClient, refresh_token: str):
    return client.post(
        "/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )


def test_register_login_and_duplicate_email_guards(client: TestClient) -> None:
    email = unique_email("auth")
    register_response = client.post(
        "/v1/auth/register",
        json={"email": email, "password": PASSWORD, "name": "Auth User"},
    )
    assert register_response.status_code == 200, register_response.text

    duplicate_response = client.post(
        "/v1/auth/register",
        json={"email": email, "password": PASSWORD, "name": "Duplicate"},
    )
    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["detail"] == "Email already registered"

    bad_login_response = login_email(client, email, "wrongpassword")
    assert bad_login_response.status_code == 401
    assert bad_login_response.json()["detail"] == "Invalid email or password"

    login_response = login_email(client, email)
    assert login_response.status_code == 200, login_response.text
    tokens = login_response.json()
    assert tokens["access_token"]
    assert tokens["refresh_token"]

    me_response = client.get("/v1/users/me", headers=auth_headers(tokens))
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


def test_refresh_token_rotates_and_old_token_cannot_be_reused(client: TestClient) -> None:
    tokens = register_user(client, "refresh")

    refresh_response = refresh(client, tokens["refresh_token"])

    assert refresh_response.status_code == 200, refresh_response.text
    rotated = refresh_response.json()
    assert rotated["access_token"]
    assert rotated["refresh_token"]
    assert rotated["refresh_token"] != tokens["refresh_token"]

    reused_response = refresh(client, tokens["refresh_token"])
    assert reused_response.status_code == 401
    assert reused_response.json()["detail"] == "Invalid or expired refresh token"

    me_response = client.get("/v1/users/me", headers=auth_headers(rotated))
    assert me_response.status_code == 200
    assert me_response.json()["email"] == tokens["email"]


def test_delete_account_invalidates_user_and_refresh_tokens(client: TestClient) -> None:
    tokens = register_user(client, "delete")
    create_household(client, tokens, "Delete Account")

    delete_response = client.delete("/v1/users/me", headers=auth_headers(tokens))
    assert delete_response.status_code == 204

    me_response = client.get("/v1/users/me", headers=auth_headers(tokens))
    assert me_response.status_code == 401
    assert me_response.json()["detail"] == "User not found"

    refresh_response = refresh(client, tokens["refresh_token"])
    assert refresh_response.status_code == 401

    login_response = login_email(client, tokens["email"])
    assert login_response.status_code == 401
