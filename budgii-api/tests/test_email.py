import pytest
from app.config import Settings
from app.services.email import EmailDeliveryError, InviteEmail, send_invite_email


def invite_message() -> InviteEmail:
    return InviteEmail(
        to_email="family@example.com",
        household_name="Family Budget",
        inviter_name="Alex",
        invite_url="https://budgii.com.au/join?code=ABC123",
        access_label="editor:standard",
    )


@pytest.mark.anyio
async def test_log_provider_does_not_call_external_api(monkeypatch) -> None:
    async def fail_post_json(*_args, **_kwargs):
        raise AssertionError("log provider should not call email API")

    monkeypatch.setattr("app.services.email._post_json", fail_post_json)

    await send_invite_email(Settings(invite_email_provider="log"), invite_message())


@pytest.mark.anyio
async def test_resend_provider_posts_expected_payload(monkeypatch) -> None:
    calls = []

    async def capture_post_json(url: str, headers: dict[str, str], payload: dict) -> None:
        calls.append((url, headers, payload))

    monkeypatch.setattr("app.services.email._post_json", capture_post_json)

    await send_invite_email(
        Settings(
            invite_email_provider="resend",
            invite_email_from="Budgii <invites@budgii.com.au>",
            invite_email_api_key="test-key",
        ),
        invite_message(),
    )

    url, headers, payload = calls[0]
    assert url == "https://api.resend.com/emails"
    assert headers["Authorization"] == "Bearer test-key"
    assert payload["from"] == "Budgii <invites@budgii.com.au>"
    assert payload["to"] == ["family@example.com"]
    assert "https://budgii.com.au/join?code=ABC123" in payload["text"]


@pytest.mark.anyio
async def test_enabled_provider_requires_from_address() -> None:
    with pytest.raises(EmailDeliveryError, match="INVITE_EMAIL_FROM"):
        await send_invite_email(
            Settings(invite_email_provider="sendgrid", invite_email_api_key="test-key"),
            invite_message(),
        )


@pytest.mark.anyio
async def test_sendgrid_provider_splits_sender_name(monkeypatch) -> None:
    calls = []

    async def capture_post_json(url: str, headers: dict[str, str], payload: dict) -> None:
        calls.append((url, headers, payload))

    monkeypatch.setattr("app.services.email._post_json", capture_post_json)

    await send_invite_email(
        Settings(
            invite_email_provider="sendgrid",
            invite_email_from="Budgii <invites@budgii.com.au>",
            invite_email_api_key="test-key",
        ),
        invite_message(),
    )

    _, _, payload = calls[0]
    assert payload["from"] == {"email": "invites@budgii.com.au", "name": "Budgii"}
