import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.alerts import evaluate_spending_alerts, load_sync_chunk


async def list_notifications(session: AsyncSession, household_id: uuid.UUID) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    notifications: list[dict[str, Any]] = []
    notifications.extend(await spending_alert_notifications(session, household_id, now))
    notifications.extend(await deal_notifications(session, household_id, now))
    return sorted(notifications, key=lambda item: item["timestamp"], reverse=True)


async def spending_alert_notifications(
    session: AsyncSession,
    household_id: uuid.UUID,
    now: datetime,
) -> list[dict[str, Any]]:
    period_start, _, evaluations = await evaluate_spending_alerts(session, household_id, now)
    category_names = await category_name_map(session, household_id)
    notifications: list[dict[str, Any]] = []

    for alert in evaluations:
        if not alert["active"]:
            continue

        category_name = category_names.get(alert["category_id"], "Budget")
        limit = alert.get("limit")
        spent = alert["spent"]
        is_exceeded = bool(limit and spent > limit)
        notification_type = "budget_exceeded" if is_exceeded else "budget_warning"
        title = "Budget Exceeded" if is_exceeded else "Budget Warning"
        description = (
            f"{category_name} is at {round(alert['progress'] * 100)}% "
            f"with ${spent:.2f} spent"
        )
        if limit:
            description += f" of ${limit:.2f}"

        notifications.append(
            {
                "id": f"alert:{alert['id']}:{period_start.date().isoformat()}",
                "type": notification_type,
                "title": title,
                "description": description,
                "timestamp": now,
                "icon": "alert",
            }
        )

    return notifications


async def deal_notifications(
    session: AsyncSession,
    household_id: uuid.UUID,
    now: datetime,
) -> list[dict[str, Any]]:
    deals = await load_sync_chunk(session, household_id, "deals")
    if not isinstance(deals, list):
        return []

    notifications: list[dict[str, Any]] = []
    for deal in deals:
        if not isinstance(deal, dict) or deal.get("actionStatus") != "new":
            continue

        name = str(deal.get("name") or "Watched item").strip()
        merchant = str(deal.get("merchant") or "a store").strip()
        sale_price = parse_float(deal.get("salePrice"))
        original_price = parse_float(deal.get("originalPrice"))
        discount = parse_float(deal.get("discountPercent"))
        found_at = parse_datetime(deal.get("foundAt")) or now

        if sale_price is not None and original_price is not None:
            description = f"{name} dropped to ${sale_price:.2f} at {merchant} (was ${original_price:.2f})"
            notification_type = "price_drop"
            title = "Price Drop Alert"
            icon = "trending_down"
        else:
            suffix = f" - {round(discount)}% off" if discount is not None else ""
            description = f"{name} has a new deal at {merchant}{suffix}"
            notification_type = "deal_found"
            title = "New Deal Match"
            icon = "gift"

        notifications.append(
            {
                "id": f"deal:{deal.get('id')}",
                "type": notification_type,
                "title": title,
                "description": description,
                "timestamp": found_at,
                "icon": icon,
            }
        )

    return notifications


async def category_name_map(session: AsyncSession, household_id: uuid.UUID) -> dict[str, str]:
    categories = await load_sync_chunk(session, household_id, "categories")
    if not isinstance(categories, list):
        return {}
    result: dict[str, str] = {}
    for category in categories:
        if not isinstance(category, dict):
            continue
        category_id = str(category.get("id") or "").strip()
        name = str(category.get("name") or "").strip()
        if category_id and name:
            result[category_id] = name
    return result


def parse_float(value: Any) -> float | None:
    return float(value) if isinstance(value, (int, float)) else None


def parse_datetime(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
