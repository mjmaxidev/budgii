from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import User
from app.schemas.alerts import (
    SpendingAlertEvaluation,
    SpendingAlertEvaluationRequest,
    SpendingAlertEvaluationResponse,
)
from app.services import alerts as alert_service
from app.services.household import require_membership
from app.services.permissions import require_can_pull

router = APIRouter()


@router.post("/{household_id}/spending-alerts/evaluate", response_model=SpendingAlertEvaluationResponse)
async def evaluate_spending_alerts(
    household_id: str,
    body: SpendingAlertEvaluationRequest | None = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SpendingAlertEvaluationResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    value = body.date if body and body.date else datetime.now(timezone.utc)
    period_start, period_end, evaluations = await alert_service.evaluate_spending_alerts(
        session,
        household_uuid,
        value,
    )
    alerts = [SpendingAlertEvaluation(**evaluation) for evaluation in evaluations]
    return SpendingAlertEvaluationResponse(
        period_start=period_start,
        period_end=period_end,
        active_count=sum(1 for alert in alerts if alert.active),
        alerts=alerts,
    )
