from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import User
from app.schemas.auth import (
    EmailLoginRequest,
    OAuthLoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
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
