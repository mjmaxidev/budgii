import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HouseholdSyncChunk
from app.services.sync import get_sync_meta


def _as_list(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _as_float(value: Any) -> float | None:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def _round_money(value: float) -> float:
    return round(value + 0.00001, 2)


async def _load_chunk(session: AsyncSession, household_id: uuid.UUID, key: str) -> HouseholdSyncChunk | None:
    return await session.get(HouseholdSyncChunk, (household_id, key))


async def run_deal_check(session: AsyncSession, household_id: uuid.UUID) -> dict[str, Any]:
    checked_at = datetime.now(timezone.utc)
    checked_at_iso = checked_at.isoformat()

    watchlist_chunk = await _load_chunk(session, household_id, "watchlistItems")
    deals_chunk = await _load_chunk(session, household_id, "deals")

    watchlist_items = _as_list(watchlist_chunk.data if watchlist_chunk else None)
    existing_deals = _as_list(deals_chunk.data if deals_chunk else None)
    existing_by_watchlist_id = {
        deal.get("watchlistItemId"): deal
        for deal in existing_deals
        if isinstance(deal.get("watchlistItemId"), str)
    }

    updated_items: list[dict[str, Any]] = []
    updated_deals_by_watchlist_id: dict[str, dict[str, Any]] = {}

    for item in watchlist_items:
        item_id = str(item.get("id") or uuid.uuid4())
        name = str(item.get("name") or "Tracked item")
        merchant = str(item.get("merchant") or "Any store")
        current_price = _as_float(item.get("currentPrice"))
        original_price = _as_float(item.get("originalPrice"))
        target_price = _as_float(item.get("targetPrice"))

        baseline = original_price or current_price or target_price or 20.0
        current = current_price or baseline
        sale_price = target_price if target_price is not None else current * 0.85
        sale_price = _round_money(max(0.5, min(current, sale_price)))
        original = _round_money(max(baseline, current, sale_price))
        discount_percent = round(((original - sale_price) / original) * 100) if original > sale_price else 0
        status = "on_sale" if discount_percent > 0 else "watching"

        updated_item = {
            **item,
            "id": item_id,
            "name": name,
            "merchant": merchant,
            "currentPrice": sale_price,
            "originalPrice": original,
            "status": status,
            "lastCheckedAt": checked_at_iso,
        }
        updated_items.append(updated_item)

        existing = existing_by_watchlist_id.get(item_id, {})
        action_status = existing.get("actionStatus") if isinstance(existing.get("actionStatus"), str) else "new"
        updated_deals_by_watchlist_id[item_id] = {
            **existing,
            "id": str(existing.get("id") or f"deal-{item_id}"),
            "watchlistItemId": item_id,
            "name": name,
            "merchant": merchant,
            "imageUrl": item.get("imageUrl") or existing.get("imageUrl"),
            "originalPrice": original,
            "salePrice": sale_price,
            "discountPercent": discount_percent,
            "foundAt": checked_at_iso,
            "actionStatus": action_status,
        }

    current_watchlist_ids = {item["id"] for item in updated_items}
    updated_deals = list(updated_deals_by_watchlist_id.values())
    updated_deals.extend(
        deal
        for deal in existing_deals
        if str(deal.get("watchlistItemId") or "") not in current_watchlist_ids
    )

    if watchlist_chunk:
        watchlist_chunk.data = updated_items
    if deals_chunk:
        deals_chunk.data = updated_deals

    meta = await get_sync_meta(session, household_id)
    if watchlist_chunk or deals_chunk:
        meta.revision += 1

    await session.flush()
    await session.refresh(meta)

    return {
        "checked_at": checked_at,
        "server_time": meta.updated_at,
        "sync_revision": meta.revision,
        "watchlist_items": updated_items,
        "deals": updated_deals,
    }
