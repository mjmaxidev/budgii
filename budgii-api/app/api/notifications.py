from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import User
from app.schemas.notifications import (
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
