from fastapi import APIRouter, Depends
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
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    return await auth_service.register_user(session, body.email, body.password, body.name, settings)


@router.post("/apple", response_model=TokenResponse)
async def login_apple(
    body: OAuthLoginRequest,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    return await auth_service.login_apple(session, body.id_token, settings)


@router.post("/google", response_model=TokenResponse)
async def login_google(
    body: OAuthLoginRequest,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    return await auth_service.login_google(session, body.id_token, settings)


@router.post("/email", response_model=TokenResponse)
async def login_email(
    body: EmailLoginRequest,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    return await auth_service.login_email(session, body.email, body.password, settings)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    body: RefreshRequest,
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    return await auth_service.refresh_access_token(session, body.refresh_token, settings)


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
