from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import User
from app.schemas.insights import BudgetInsightResponse
from app.services import insights as insight_service
from app.services.household import require_membership
from app.services.permissions import require_can_pull

router = APIRouter()


@router.post("/{household_id}/insights/budget", response_model=BudgetInsightResponse)
async def budget_insight(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> BudgetInsightResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    result = await insight_service.generate_budget_insight(session, household_uuid, settings)
    return BudgetInsightResponse(**result)
