import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models import AuthActionToken, RefreshToken, User
from app.schemas.auth import TokenResponse
from app.services.email import AuthEmail, send_auth_email
from app.services.oauth import OAuthVerificationError, verify_apple_id_token, verify_google_id_token
from app.services.security import (
    create_access_token,
    create_refresh_token_value,
    hash_password,
    hash_token,
    verify_password,
)

EMAIL_VERIFICATION = "email_verification"
PASSWORD_RESET = "password_reset"


async def issue_tokens(session: AsyncSession, user: User, settings: Settings) -> TokenResponse:
    access_token = create_access_token(str(user.id), settings)
    refresh_value = create_refresh_token_value()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)

    session.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_value),
            expires_at=expires_at,
        )
    )
    await session.flush()
    return TokenResponse(access_token=access_token, refresh_token=refresh_value)


async def register_user(
    session: AsyncSession, email: str, password: str, name: str, settings: Settings
) -> TokenResponse:
    normalized = email.lower().strip()
    existing = await session.scalar(select(User).where(User.email == normalized))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=normalized,
        password_hash=hash_password(password),
        name=name.strip() or normalized.split("@")[0],
        auth_provider="email",
    )
    session.add(user)
    await session.flush()
    return await issue_tokens(session, user, settings)


async def login_email(session: AsyncSession, email: str, password: str, settings: Settings) -> TokenResponse:
    normalized = email.lower().strip()
    user = await session.scalar(select(User).where(User.email == normalized))
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return await issue_tokens(session, user, settings)


async def request_email_verification(session: AsyncSession, email: str, settings: Settings) -> None:
    user = await user_by_email(session, email)
    if not user:
        return
    if user.email_verified_at:
        return
    token = await create_action_token(session, user, EMAIL_VERIFICATION, timedelta(hours=24))
    await send_auth_email(settings, verification_email(user, token, settings))


async def confirm_email_verification(session: AsyncSession, token: str) -> None:
    action = await consume_action_token(session, token, EMAIL_VERIFICATION)
    user = await session.get(User, action.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    user.email_verified_at = datetime.now(timezone.utc)
    await session.flush()


async def request_password_reset(session: AsyncSession, email: str, settings: Settings) -> None:
    user = await user_by_email(session, email)
    if not user or user.auth_provider != "email" or not user.password_hash:
        return
    token = await create_action_token(session, user, PASSWORD_RESET, timedelta(hours=1))
    await send_auth_email(settings, password_reset_email(user, token, settings))


async def confirm_password_reset(
    session: AsyncSession,
    token: str,
    new_password: str,
) -> None:
    action = await consume_action_token(session, token, PASSWORD_RESET)
    user = await session.get(User, action.user_id)
    if not user or user.auth_provider != "email":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    user.password_hash = hash_password(new_password)
    await revoke_refresh_tokens(session, user)
    await session.flush()


async def user_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email.lower().strip()))


async def create_action_token(
    session: AsyncSession,
    user: User,
    purpose: str,
    ttl: timedelta,
) -> str:
    token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    session.add(
        AuthActionToken(
            user_id=user.id,
            token_hash=hash_token(token),
            purpose=purpose,
            expires_at=now + ttl,
        )
    )
    await session.flush()
    return token


async def consume_action_token(
    session: AsyncSession,
    token: str,
    purpose: str,
) -> AuthActionToken:
    now = datetime.now(timezone.utc)
    action = await session.scalar(
        select(AuthActionToken).where(
            AuthActionToken.token_hash == hash_token(token),
            AuthActionToken.purpose == purpose,
            AuthActionToken.used_at.is_(None),
            AuthActionToken.expires_at > now,
        )
    )
    if not action:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
    action.used_at = now
    await session.flush()
    return action


async def revoke_refresh_tokens(session: AsyncSession, user: User) -> None:
    records = await session.scalars(select(RefreshToken).where(RefreshToken.user_id == user.id))
    for record in records.all():
        await session.delete(record)


def verification_email(user: User, token: str, settings: Settings) -> AuthEmail:
    link = f"{settings.auth_link_base.rstrip('/')}/#/verification?token={token}"
    text = (
        "Verify your Budgii email address by opening this link:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours."
    )
    html = (
        "<p>Verify your Budgii email address.</p>"
        f'<p><a href="{link}">Verify email</a></p>'
        "<p>This link expires in 24 hours.</p>"
    )
    return AuthEmail(
        to_email=user.email,
        subject="Verify your Budgii email",
        text=text,
        html=html,
        log_label=f"email_verification url={link}",
    )


def password_reset_email(user: User, token: str, settings: Settings) -> AuthEmail:
    link = f"{settings.auth_link_base.rstrip('/')}/#/reset-password?token={token}"
    text = f"Reset your Budgii password by opening this link:\n\n{link}\n\nThis link expires in 1 hour."
    html = (
        "<p>Reset your Budgii password.</p>"
        f'<p><a href="{link}">Reset password</a></p>'
        "<p>This link expires in 1 hour.</p>"
    )
    return AuthEmail(
        to_email=user.email,
        subject="Reset your Budgii password",
        text=text,
        html=html,
        log_label=f"password_reset url={link}",
    )


async def login_oauth(
    session: AsyncSession,
    provider: str,
    email: str,
    name: str,
    avatar: str | None,
    external_id: str | None,
    settings: Settings,
) -> TokenResponse:
    user = await session.scalar(select(User).where(User.email == email))
    if user:
        if user.auth_provider == "email" and user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Sign in with email instead.",
            )
        user.auth_provider = provider
        if external_id:
            user.external_id = external_id
        if name and not user.name:
            user.name = name
        if avatar:
            user.avatar = avatar
        if not user.email_verified_at:
            user.email_verified_at = datetime.now(timezone.utc)
    else:
        user = User(
            email=email,
            name=name,
            avatar=avatar,
            auth_provider=provider,
            external_id=external_id,
            email_verified_at=datetime.now(timezone.utc),
        )
        session.add(user)
        await session.flush()

    return await issue_tokens(session, user, settings)


async def login_google(session: AsyncSession, id_token: str, settings: Settings) -> TokenResponse:
    try:
        email, name, avatar = await verify_google_id_token(id_token, settings)
    except OAuthVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return await login_oauth(session, "google", email, name, avatar, email, settings)


async def login_apple(session: AsyncSession, id_token: str, settings: Settings) -> TokenResponse:
    try:
        email, name, avatar = await verify_apple_id_token(id_token, settings)
    except OAuthVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return await login_oauth(session, "apple", email, name, avatar, email, settings)


async def refresh_access_token(
    session: AsyncSession, refresh_token: str, settings: Settings
) -> TokenResponse:
    token_hash = hash_token(refresh_token)
    now = datetime.now(timezone.utc)
    record = await session.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash, RefreshToken.expires_at > now)
    )
    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token"
        )

    user = await session.get(User, record.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    await session.delete(record)
    return await issue_tokens(session, user, settings)


async def delete_user(session: AsyncSession, user: User) -> None:
    await session.delete(user)
