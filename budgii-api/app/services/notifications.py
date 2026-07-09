import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import NotificationDeviceToken, NotificationReadState
from app.services.alerts import evaluate_spending_alerts, load_sync_chunk


async def list_notifications(
    session: AsyncSession, household_id: uuid.UUID, user_id: uuid.UUID | None = None
) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc)
    notifications: list[dict[str, Any]] = []
    notifications.extend(await spending_alert_notifications(session, household_id, now))
    notifications.extend(await deal_notifications(session, household_id, now))
    if user_id:
        read_ids = await notification_read_ids(session, household_id, user_id)
        for notification in notifications:
            notification["read"] = notification["id"] in read_ids
    return sorted(notifications, key=lambda item: item["timestamp"], reverse=True)


async def mark_notification_read(
    session: AsyncSession,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
    notification_id: str,
) -> NotificationReadState:
    normalized_id = notification_id.strip()
    read_state = await session.scalar(
        select(NotificationReadState).where(
            NotificationReadState.household_id == household_id,
            NotificationReadState.user_id == user_id,
            NotificationReadState.notification_id == normalized_id,
        )
    )
    if read_state:
        read_state.read_at = datetime.now(timezone.utc)
        return read_state

    read_state = NotificationReadState(
        household_id=household_id,
        user_id=user_id,
        notification_id=normalized_id,
    )
    session.add(read_state)
    await session.flush()
    return read_state


async def mark_all_notifications_read(
    session: AsyncSession,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
) -> int:
    notifications = await list_notifications(session, household_id)
    for notification in notifications:
        await mark_notification_read(session, household_id, user_id, notification["id"])
    return len(notifications)


async def register_device_token(
    session: AsyncSession,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
    token: str,
    platform: str,
    device_id: str | None = None,
    app_version: str | None = None,
) -> NotificationDeviceToken:
    existing = await session.scalar(
        select(NotificationDeviceToken).where(
            NotificationDeviceToken.household_id == household_id,
            NotificationDeviceToken.user_id == user_id,
            NotificationDeviceToken.token == token,
        )
    )
    if existing:
        existing.platform = platform
        existing.device_id = device_id
        existing.app_version = app_version
        existing.enabled = True
        await session.flush()
        await session.refresh(existing)
        return existing

    device_token = NotificationDeviceToken(
        household_id=household_id,
        user_id=user_id,
        token=token,
        platform=platform,
        device_id=device_id,
        app_version=app_version,
    )
    session.add(device_token)
    await session.flush()
    return device_token


async def list_device_tokens(
    session: AsyncSession,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[NotificationDeviceToken]:
    result = await session.scalars(
        select(NotificationDeviceToken)
        .where(
            NotificationDeviceToken.household_id == household_id,
            NotificationDeviceToken.user_id == user_id,
        )
        .order_by(NotificationDeviceToken.updated_at.desc())
    )
    return list(result.all())


async def disable_device_token(
    session: AsyncSession,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
    token_id: uuid.UUID,
) -> NotificationDeviceToken | None:
    device_token = await session.scalar(
        select(NotificationDeviceToken).where(
            NotificationDeviceToken.id == token_id,
            NotificationDeviceToken.household_id == household_id,
            NotificationDeviceToken.user_id == user_id,
        )
    )
    if not device_token:
        return None
    device_token.enabled = False
    await session.flush()
    await session.refresh(device_token)
    return device_token


async def notification_read_ids(
    session: AsyncSession,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
) -> set[str]:
    result = await session.scalars(
        select(NotificationReadState.notification_id).where(
            NotificationReadState.household_id == household_id,
            NotificationReadState.user_id == user_id,
        )
    )
    return set(result.all())


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
        description = f"{category_name} is at {round(alert['progress'] * 100)}% with ${spent:.2f} spent"
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
