from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.models import RefreshToken, User
from app.schemas.auth import TokenResponse
from app.services.oauth import OAuthVerificationError, verify_apple_id_token, verify_google_id_token
from app.services.security import (
    create_access_token,
    create_refresh_token_value,
    hash_password,
    hash_token,
    verify_password,
)


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
    else:
        user = User(
            email=email,
            name=name,
            avatar=avatar,
            auth_provider=provider,
            external_id=external_id,
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
