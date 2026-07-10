from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import User
from app.schemas.auth import ChangePasswordRequest, UpdateUserRequest, UserResponse
from app.services import auth as auth_service
from app.services.security import hash_password, verify_password

router = APIRouter()

AVATAR_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


@router.get("/me", response_model=UserResponse)
async def get_me(
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    return user_response(user, settings)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UpdateUserRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    if body.email is not None:
        normalized_email = str(body.email).lower().strip()
        existing = await session.scalar(
            select(User).where(User.email == normalized_email, User.id != user.id)
        )
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        if normalized_email != user.email:
            user.email = normalized_email
            user.email_verified_at = None

    if body.name is not None:
        user.name = body.name.strip()

    if body.avatar is not None:
        avatar = body.avatar.strip()
        if avatar.startswith("/users/me/avatar"):
            pass
        else:
            user.avatar = avatar or None

    await session.flush()
    return user_response(user, settings)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserResponse:
    extension = AVATAR_CONTENT_TYPES.get(file.content_type or "")
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Avatar must be a JPEG, PNG, WebP, or GIF image",
        )

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Avatar image is too large"
        )

    upload_dir = Path(settings.receipt_storage_path) / "avatars" / str(user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    storage_path = upload_dir / f"{uuid4().hex}{extension}"
    storage_path.write_bytes(content)

    old_path = avatar_storage_path(user.avatar, settings)
    user.avatar = str(storage_path)
    await session.flush()

    if old_path and old_path != storage_path and old_path.is_file():
        old_path.unlink(missing_ok=True)

    return user_response(user, settings)


@router.get("/me/avatar")
async def get_avatar(
    user: User = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> FileResponse:
    path = avatar_storage_path(user.avatar, settings)
    if not path or not path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar file not found")
    return FileResponse(path)


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    if user.auth_provider != "email" or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password changes are only available for email accounts",
        )

    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")

    user.password_hash = hash_password(body.new_password)
    await session.flush()


def avatar_storage_path(avatar: str | None, settings: Settings) -> Path | None:
    if not avatar:
        return None
    path = Path(avatar)
    storage_root = Path(settings.receipt_storage_path)
    try:
        path.relative_to(storage_root)
    except ValueError:
        return None
    return path


def avatar_response_value(user: User, settings: Settings) -> str | None:
    path = avatar_storage_path(user.avatar, settings)
    if not path:
        return user.avatar
    version = int(path.stat().st_mtime) if path.is_file() else 0
    return f"/users/me/avatar?v={version}"


def user_response(user: User, settings: Settings) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        avatar=avatar_response_value(user, settings),
        auth_provider=user.auth_provider,
        email_verified_at=user.email_verified_at.isoformat() if user.email_verified_at else None,
    )


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    await auth_service.delete_user(session, user)
