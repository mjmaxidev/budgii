import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.services.alerts import load_sync_chunk, month_bounds, spend_by_category
from app.services.ocr import parse_response_json

INSIGHT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["summary", "actions"],
    "properties": {
        "summary": {"type": "string", "maxLength": 180},
        "actions": {
            "type": "array",
            "minItems": 1,
            "maxItems": 3,
            "items": {"type": "string", "maxLength": 140},
        },
    },
}


async def generate_budget_insight(
    session: AsyncSession,
    household_id: uuid.UUID,
    settings: Settings,
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    start, end = month_bounds(now)
    spending = await spend_by_category(session, household_id, start, end)
    budget = await load_sync_chunk(session, household_id, "budget")
    categories = await load_sync_chunk(session, household_id, "categories")
    category_names = {
        str(item.get("id")): str(item.get("name"))
        for item in categories or []
        if isinstance(item, dict) and item.get("id") and item.get("name")
    }
    category_totals = sorted(
        (
            {"category": category_names.get(key, "Other"), "spent": round(value, 2)}
            for key, value in spending.items()
        ),
        key=lambda item: item["spent"],
        reverse=True,
    )
    budget_limit = float(budget.get("limit") or 0) if isinstance(budget, dict) else 0
    total = round(sum(spending.values()), 2)
    payload = {
        "month_progress_percent": round((now.day / max(1, (end - start).days)) * 100),
        "budget": budget_limit,
        "spent": total,
        "remaining": round(budget_limit - total, 2),
        "categories": category_totals[:8],
    }

    if settings.openai_api_key and category_totals:
        try:
            return {**(await openai_insight(payload, settings)), "source": "ai"}
        except (httpx.HTTPError, ValueError, json.JSONDecodeError, KeyError, TypeError):
            pass
    return {**deterministic_insight(payload), "source": "deterministic"}


async def openai_insight(payload: dict[str, Any], settings: Settings) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={
                "model": settings.ai_insights_model,
                "input": (
                    "You are Budgii, a concise household budget coach. Analyze only the supplied aggregate data. "
                    "Give practical, non-judgmental actions. Do not provide investment, credit, tax, or legal advice. "
                    f"Data: {json.dumps(payload, separators=(',', ':'))}"
                ),
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "budget_insight",
                        "strict": True,
                        "schema": INSIGHT_SCHEMA,
                    }
                },
            },
        )
        response.raise_for_status()
        result = parse_response_json(response.json())
    return {"summary": str(result["summary"]), "actions": [str(item) for item in result["actions"]]}


def deterministic_insight(payload: dict[str, Any]) -> dict[str, Any]:
    spent = float(payload["spent"])
    budget = float(payload["budget"])
    categories = payload["categories"]
    if not categories:
        return {
            "summary": "Add a few expenses and Budgii can spot useful spending patterns.",
            "actions": ["Record this month's purchases or scan a receipt to get started."],
        }

    top = categories[0]
    progress = int(payload["month_progress_percent"])
    used = round((spent / budget) * 100) if budget > 0 else 0
    summary = f"{top['category']} is your largest category at ${top['spent']:.2f} this month."
    actions = [f"Review recent {top['category'].lower()} purchases for one easy saving."]
    if budget > 0 and used > progress + 10:
        actions.append(
            f"You've used {used}% of the budget about {progress}% through the month; slow discretionary spending."
        )
    elif budget > 0:
        actions.append(f"You have ${max(0, budget - spent):.2f} left in this month's budget.")
    return {"summary": summary, "actions": actions}
