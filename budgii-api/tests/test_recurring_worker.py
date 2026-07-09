import asyncio
import uuid
from datetime import date

from app.db.session import async_session_factory, engine
from app.models import Expense
from app.workers.recurring import apply_due_recurring_for_all_households
from fastapi.testclient import TestClient
from sqlalchemy import select

from tests.helpers import auth_headers, bootstrap, create_household, register_user


def test_recurring_worker_applies_due_transactions_once(client: TestClient) -> None:
    admin = register_user(client, "worker-recurring-admin")
    household = create_household(client, admin, "Worker Recurring")
    bootstrap_response = bootstrap(client, admin, household["id"])
    assert bootstrap_response.status_code == 200

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": bootstrap_response.json()["revision"],
            "changes": {
                "recurringTransactions": [
                    {
                        "id": "worker-daily",
                        "frequency": "daily",
                        "startDate": "2026-07-01",
                        "enabled": True,
                        "expense": {
                            "merchant": "Worker Daily",
                            "amount": 4,
                            "categoryId": "cat-bills",
                        },
                    },
                    {
                        "id": "worker-paused",
                        "frequency": "daily",
                        "enabled": False,
                        "expense": {
                            "merchant": "Worker Paused",
                            "amount": 8,
                            "categoryId": "cat-bills",
                        },
                    },
                    {
                        "id": "worker-future",
                        "frequency": "daily",
                        "startDate": "2026-07-08",
                        "enabled": True,
                        "expense": {
                            "merchant": "Worker Future",
                            "amount": 9,
                            "categoryId": "cat-bills",
                        },
                    },
                ],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text

    first_summary = asyncio.run(run_worker(date(2026, 7, 7)))
    assert first_summary["households_scanned"] >= 1
    assert first_summary["households_applied"] >= 1
    assert first_summary["applied_count"] >= 1
    assert household["id"] not in first_summary["failed_household_ids"]

    merchants = asyncio.run(list_expense_merchants(household["id"]))
    assert [merchant for merchant in merchants if merchant == "Worker Daily"] == ["Worker Daily"]
    assert "Worker Paused" not in set(merchants)
    assert "Worker Future" not in set(merchants)

    second_summary = asyncio.run(run_worker(date(2026, 7, 7)))
    assert second_summary["failed_household_ids"] == []

    repeat_merchants = asyncio.run(list_expense_merchants(household["id"]))
    assert [merchant for merchant in repeat_merchants if merchant == "Worker Daily"] == ["Worker Daily"]


async def run_worker(due_date: date) -> dict:
    await engine.dispose()
    async with async_session_factory() as session:
        summary = await apply_due_recurring_for_all_households(session, due_date)
        await session.commit()
        return summary.as_dict()


async def list_expense_merchants(household_id: str) -> list[str]:
    await engine.dispose()
    async with async_session_factory() as session:
        result = await session.scalars(
            select(Expense.merchant).where(Expense.household_id == uuid.UUID(household_id))
        )
        return list(result.all())
