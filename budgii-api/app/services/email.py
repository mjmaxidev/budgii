import logging
from dataclasses import dataclass
from email.utils import parseaddr

import httpx

from app.config import Settings

logger = logging.getLogger("budgii.email")


class EmailDeliveryError(RuntimeError):
    pass


@dataclass(frozen=True)
class InviteEmail:
    to_email: str
    household_name: str
    inviter_name: str
    invite_url: str
    access_label: str


@dataclass(frozen=True)
class AuthEmail:
    to_email: str
    subject: str
    text: str
    html: str
    log_label: str


async def send_invite_email(settings: Settings, message: InviteEmail) -> None:
    await send_email(
        settings,
        AuthEmail(
            to_email=message.to_email,
            subject=f"{message.inviter_name} invited you to Budgii",
            text=_invite_text(message),
            html=_invite_html(message),
            log_label=f"household={message.household_name} url={message.invite_url}",
        ),
    )


async def send_auth_email(settings: Settings, message: AuthEmail) -> None:
    await send_email(settings, message)


async def send_email(settings: Settings, message: AuthEmail) -> None:
    provider = settings.invite_email_provider.strip().lower()
    if provider in {"", "log", "none"}:
        logger.info(
            "email_log provider=%s to=%s subject=%s %s",
            provider or "none",
            message.to_email,
            message.subject,
            message.log_label,
        )
        return

    if not settings.invite_email_from:
        raise EmailDeliveryError("INVITE_EMAIL_FROM is required when invite email delivery is enabled")

    if provider == "resend":
        await _send_resend(settings, message)
        return

    if provider == "sendgrid":
        await _send_sendgrid(settings, message)
        return

    raise EmailDeliveryError(f"Unsupported invite email provider: {settings.invite_email_provider}")


async def _send_resend(settings: Settings, message: AuthEmail) -> None:
    if not settings.invite_email_api_key:
        raise EmailDeliveryError("INVITE_EMAIL_API_KEY is required for Resend")

    await _post_json(
        "https://api.resend.com/emails",
        {
            "Authorization": f"Bearer {settings.invite_email_api_key}",
            "Content-Type": "application/json",
        },
        {
            "from": settings.invite_email_from,
            "to": [message.to_email],
            "subject": message.subject,
            "html": message.html,
            "text": message.text,
        },
    )


async def _send_sendgrid(settings: Settings, message: AuthEmail) -> None:
    if not settings.invite_email_api_key:
        raise EmailDeliveryError("INVITE_EMAIL_API_KEY is required for SendGrid")

    from_name, from_email = _parse_sender(settings.invite_email_from)
    await _post_json(
        "https://api.sendgrid.com/v3/mail/send",
        {
            "Authorization": f"Bearer {settings.invite_email_api_key}",
            "Content-Type": "application/json",
        },
        {
            "personalizations": [{"to": [{"email": message.to_email}]}],
            "from": {"email": from_email, **({"name": from_name} if from_name else {})},
            "subject": message.subject,
            "content": [
                {"type": "text/plain", "value": message.text},
                {"type": "text/html", "value": message.html},
            ],
        },
    )


async def _post_json(url: str, headers: dict[str, str], payload: dict) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(url, headers=headers, json=payload)
    if response.status_code >= 400:
        raise EmailDeliveryError(f"Email provider returned HTTP {response.status_code}: {response.text}")


def _parse_sender(sender: str) -> tuple[str, str]:
    name, email = parseaddr(sender)
    return name, email or sender


def _invite_text(message: InviteEmail) -> str:
    return (
        f"{message.inviter_name} invited you to join {message.household_name} on Budgii "
        f"with {message.access_label} access.\n\n"
        f"Accept the invite: {message.invite_url}\n\n"
        "This invite expires in 7 days."
    )


def _invite_html(message: InviteEmail) -> str:
    return f"""
<p>
  {message.inviter_name} invited you to join <strong>{message.household_name}</strong>
  on Budgii with {message.access_label} access.
</p>
<p><a href="{message.invite_url}">Accept the invite</a></p>
<p>This invite expires in 7 days.</p>
"""
