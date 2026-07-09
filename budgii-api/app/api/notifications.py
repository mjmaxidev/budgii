from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import User
from app.schemas.notifications import (
    DeviceTokenListResponse,
    DeviceTokenRegisterRequest,
    DeviceTokenResponse,
    NotificationListResponse,
    NotificationReadResponse,
    NotificationResponse,
)
from app.services import notifications as notification_service
from app.services.household import require_membership
from app.services.permissions import require_can_pull

router = APIRouter()


@router.get("/{household_id}/notifications", response_model=NotificationListResponse)
async def list_notifications(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> NotificationListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    notifications = await notification_service.list_notifications(session, household_uuid, user.id)
    return NotificationListResponse(
        notifications=[NotificationResponse(**notification) for notification in notifications]
    )


@router.patch(
    "/{household_id}/notifications/{notification_id}/read",
    response_model=NotificationReadResponse,
)
async def mark_notification_read(
    household_id: str,
    notification_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> NotificationReadResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    read_state = await notification_service.mark_notification_read(
        session, household_uuid, user.id, notification_id
    )
    return NotificationReadResponse(notification_id=read_state.notification_id, read=True)


@router.post("/{household_id}/notifications/read-all")
async def mark_all_notifications_read(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict[str, int | bool]:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    count = await notification_service.mark_all_notifications_read(session, household_uuid, user.id)
    return {"read": True, "count": count}


@router.post(
    "/{household_id}/notifications/device-tokens",
    response_model=DeviceTokenResponse,
)
async def register_device_token(
    household_id: str,
    payload: DeviceTokenRegisterRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DeviceTokenResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    device_token = await notification_service.register_device_token(
        session,
        household_uuid,
        user.id,
        payload.token,
        payload.platform,
        payload.device_id,
        payload.app_version,
    )
    return device_token_response(device_token)


@router.get(
    "/{household_id}/notifications/device-tokens",
    response_model=DeviceTokenListResponse,
)
async def list_device_tokens(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DeviceTokenListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    device_tokens = await notification_service.list_device_tokens(session, household_uuid, user.id)
    return DeviceTokenListResponse(tokens=[device_token_response(token) for token in device_tokens])


@router.delete(
    "/{household_id}/notifications/device-tokens/{token_id}",
    response_model=DeviceTokenResponse,
)
async def unregister_device_token(
    household_id: str,
    token_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DeviceTokenResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    token_uuid = parse_uuid(token_id, "token_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    device_token = await notification_service.disable_device_token(
        session, household_uuid, user.id, token_uuid
    )
    if not device_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device token not found")
    return device_token_response(device_token)


def device_token_response(device_token) -> DeviceTokenResponse:
    return DeviceTokenResponse(
        id=str(device_token.id),
        platform=device_token.platform,
        device_id=device_token.device_id,
        app_version=device_token.app_version,
        enabled=device_token.enabled,
        created_at=device_token.created_at,
        updated_at=device_token.updated_at,
    )
