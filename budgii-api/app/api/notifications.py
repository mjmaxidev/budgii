from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import User
from app.schemas.notifications import NotificationListResponse, NotificationResponse
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
    notifications = await notification_service.list_notifications(session, household_uuid)
    return NotificationListResponse(
        notifications=[NotificationResponse(**notification) for notification in notifications]
    )
