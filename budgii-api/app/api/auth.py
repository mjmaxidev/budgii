from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.auth import (
    AuthActionResponse,
    EmailLoginRequest,
    EmailActionRequest,
    OAuthLoginRequest,
    PasswordResetConfirmRequest,
    RefreshRequest,
    RegisterRequest,
    TokenActionRequest,
    TokenResponse,
)
from app.services import auth as auth_service

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user_agent, ip_address = auth_client_metadata(request)
    return await auth_service.register_user(
        session,
        body.email,
        body.password,
        body.name,
        settings,
        user_agent,
        ip_address,
    )


@router.post("/apple", response_model=TokenResponse)
async def login_apple(
    body: OAuthLoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user_agent, ip_address = auth_client_metadata(request)
    return await auth_service.login_apple(session, body.id_token, settings, user_agent, ip_address)


@router.post("/google", response_model=TokenResponse)
async def login_google(
    body: OAuthLoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user_agent, ip_address = auth_client_metadata(request)
    return await auth_service.login_google(session, body.id_token, settings, user_agent, ip_address)


@router.post("/email", response_model=TokenResponse)
async def login_email(
    body: EmailLoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user_agent, ip_address = auth_client_metadata(request)
    return await auth_service.login_email(
        session,
        body.email,
        body.password,
        settings,
        user_agent,
        ip_address,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    request: Request,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user_agent, ip_address = auth_client_metadata(request)
    return await auth_service.refresh_access_token(
        session,
        body.refresh_token,
        settings,
        user_agent,
        ip_address,
    )


@router.post("/email-verification/request", response_model=AuthActionResponse)
async def request_email_verification(
    body: EmailActionRequest,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthActionResponse:
    await auth_service.request_email_verification(session, body.email, settings)
    return AuthActionResponse()


@router.post("/email-verification/confirm", response_model=AuthActionResponse)
async def confirm_email_verification(
    body: TokenActionRequest,
    session: AsyncSession = Depends(get_db),
) -> AuthActionResponse:
    await auth_service.confirm_email_verification(session, body.token)
    return AuthActionResponse()


@router.post("/password-reset/request", response_model=AuthActionResponse)
async def request_password_reset(
    body: EmailActionRequest,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthActionResponse:
    await auth_service.request_password_reset(session, body.email, settings)
    return AuthActionResponse()


@router.post("/password-reset/confirm", response_model=AuthActionResponse)
async def confirm_password_reset(
    body: PasswordResetConfirmRequest,
    session: AsyncSession = Depends(get_db),
) -> AuthActionResponse:
    await auth_service.confirm_password_reset(session, body.token, body.new_password)
    return AuthActionResponse()


def auth_client_metadata(request: Request) -> tuple[str | None, str | None]:
    user_agent = request.headers.get("user-agent")
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip_address = forwarded_for.split(",", 1)[0].strip()
    else:
        ip_address = request.client.host if request.client else None

    return trim_or_none(user_agent, 255), trim_or_none(ip_address, 64)


def trim_or_none(value: str | None, max_length: int) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    return trimmed[:max_length] or None
