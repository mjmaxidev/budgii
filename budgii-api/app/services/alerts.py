import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Expense, HouseholdSyncChunk


def month_bounds(value: datetime) -> tuple[datetime, datetime]:
    value = as_utc(value)
    start = datetime(value.year, value.month, 1, tzinfo=timezone.utc)
    if value.month == 12:
        end = datetime(value.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(value.year, value.month + 1, 1, tzinfo=timezone.utc)
    return start, end


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


async def load_sync_chunk(session: AsyncSession, household_id: uuid.UUID, key: str) -> Any:
    chunk = await session.get(HouseholdSyncChunk, (household_id, key))
    return chunk.data if chunk else None


async def spend_by_category(
    session: AsyncSession,
    household_id: uuid.UUID,
    period_start: datetime,
    period_end: datetime,
) -> dict[str, float]:
    rows = await session.execute(
        select(Expense.category_id, func.coalesce(func.sum(Expense.amount), 0))
        .where(
            Expense.household_id == household_id,
            Expense.date >= period_start,
            Expense.date < period_end,
        )
        .group_by(Expense.category_id)
    )
    return {category_id: float(total or 0) for category_id, total in rows.all()}


async def evaluate_spending_alerts(
    session: AsyncSession,
    household_id: uuid.UUID,
    value: datetime,
) -> tuple[datetime, datetime, list[dict[str, Any]]]:
    period_start, period_end = month_bounds(value)
    alerts = await load_sync_chunk(session, household_id, "spendingAlerts")
    budget = await load_sync_chunk(session, household_id, "budget")
    if not isinstance(alerts, list):
        alerts = []
    if not isinstance(budget, dict):
        budget = {}

    allocations = budget.get("categoryAllocations")
    if not isinstance(allocations, dict):
        allocations = {}

    spent_by_category = await spend_by_category(session, household_id, period_start, period_end)
    evaluations: list[dict[str, Any]] = []
    for alert in alerts:
        if not isinstance(alert, dict):
            continue
        alert_id = str(alert.get("id") or "").strip()
        category_id = str(alert.get("categoryId") or "").strip()
        alert_type = str(alert.get("alertType") or "").strip()
        threshold = parse_positive_float(alert.get("threshold"))
        if not alert_id or not category_id or alert_type not in ("amount", "percentage") or threshold is None:
            continue

        spent = spent_by_category.get(category_id, 0)
        limit = parse_positive_float(allocations.get(category_id))
        if alert_type == "amount":
            progress = spent / threshold if threshold > 0 else 0
            active = spent >= threshold
        else:
            progress = spent / limit if limit else 0
            active = bool(limit and (progress * 100) >= threshold)

        evaluations.append(
            {
                "id": alert_id,
                "category_id": category_id,
                "alert_type": alert_type,
                "threshold": threshold,
                "spent": spent,
                "limit": limit,
                "progress": progress,
                "active": active,
            }
        )

    return period_start, period_end, evaluations


def parse_positive_float(value: Any) -> float | None:
    if not isinstance(value, (int, float)):
        return None
    parsed = float(value)
    return parsed if parsed > 0 else None
