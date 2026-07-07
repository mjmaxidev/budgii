from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import User
from app.schemas.deals import DealCheckResponse
from app.services import deals as deal_service
from app.services.household import require_membership
from app.services.permissions import require_can_push

router = APIRouter()


@router.post("/{household_id}/deals/check", response_model=DealCheckResponse)
async def run_deal_check(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> DealCheckResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_push(membership)
    result = await deal_service.run_deal_check(session, household_uuid)
    return DealCheckResponse(**result)
