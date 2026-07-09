#!/usr/bin/env python3
"""Seed a richer Budgii development dataset into the backend database.

Usage from the host:
  cd budgii-api && python scripts/seed_mock_data.py

Usage from Docker Compose:
  docker compose -f docker-compose.dev.yml exec api python scripts/seed_mock_data.py

Defaults match the dev login form:
  dev@mjproductions.app / password
"""

from __future__ import annotations

import argparse
import asyncio
import copy
import sys
import uuid
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select

# Allow `python scripts/seed_mock_data.py` from budgii-api/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import async_session_factory
from app.models import (
    Expense,
    HouseholdMembership,
    HouseholdPersona,
    HouseholdSyncChunk,
    HouseholdSyncMeta,
    Receipt,
    ReceiptItem,
    User,
)
from app.services.household import create_household
from app.services.security import hash_password
from app.services.seed import DEFAULT_DOCUMENT, SYNC_KEYS

DEFAULT_EMAIL = "dev@mjproductions.app"
DEFAULT_PASSWORD = "password"
DEFAULT_NAME = "Max"
DEFAULT_HOUSEHOLD = "Lee Household"
MOCK_NAMESPACE = uuid.UUID("c4b2eb5f-8dc5-45ef-9122-19f9f3c6de2f")


def stable_uuid(household_id: uuid.UUID, label: str) -> uuid.UUID:
    return uuid.uuid5(MOCK_NAMESPACE, f"{household_id}:{label}")


def day(offset: int) -> str:
    return (date.today() + timedelta(days=offset)).isoformat()


def dt(offset: int) -> datetime:
    value = date.today() + timedelta(days=offset)
    return datetime.combine(value, time(hour=10, minute=30), tzinfo=timezone.utc)


def today_iso() -> str:
    return date.today().isoformat()


async def get_or_create_user(
    session,
    *,
    email: str,
    password: str,
    name: str,
    household_name: str,
    force: bool,
) -> tuple[User, HouseholdMembership]:
    normalized = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized))

    if user and force:
        await session.delete(user)
        await session.flush()
        user = None

    if not user:
        user = User(
            email=normalized,
            password_hash=hash_password(password),
            name=name.strip(),
            avatar="🧑",
            auth_provider="email",
        )
        session.add(user)
        await session.flush()
        _, membership = await create_household(session, user, household_name)
        return user, membership

    membership = await session.scalar(
        select(HouseholdMembership)
        .where(HouseholdMembership.user_id == user.id)
        .order_by(HouseholdMembership.joined_at)
    )
    if membership:
        return user, membership

    _, membership = await create_household(session, user, household_name)
    return user, membership


async def get_or_create_persona(
    session,
    household_id: uuid.UUID,
    *,
    name: str,
    relationship: str,
    avatar: str,
) -> HouseholdPersona:
    persona = await session.scalar(
        select(HouseholdPersona).where(
            HouseholdPersona.household_id == household_id,
            HouseholdPersona.name == name,
        )
    )
    if persona:
        persona.relation_label = relationship
        persona.avatar = avatar
        persona.active = True
        return persona

    persona = HouseholdPersona(
        household_id=household_id,
        name=name,
        relation_label=relationship,
        avatar=avatar,
        active=True,
        is_default=False,
    )
    session.add(persona)
    await session.flush()
    return persona


async def sync_chunks(session, household_id: uuid.UUID) -> dict[str, HouseholdSyncChunk]:
    result = await session.scalars(
        select(HouseholdSyncChunk).where(HouseholdSyncChunk.household_id == household_id)
    )
    chunks = {chunk.chunk_key: chunk for chunk in result.all()}
    for key in SYNC_KEYS:
        if key in chunks:
            continue
        chunk = HouseholdSyncChunk(
            household_id=household_id,
            chunk_key=key,
            data=copy.deepcopy(DEFAULT_DOCUMENT[key]),
        )
        session.add(chunk)
        chunks[key] = chunk
    await session.flush()
    return chunks


def mock_sync_document(personas: dict[str, HouseholdPersona]) -> dict[str, Any]:
    you_id = str(personas["you"].id)
    sam_id = str(personas["sam"].id)

    categories = [
        {"id": "cat-groceries", "name": "Groceries", "icon": "🛒", "color": "#16A34A"},
        {"id": "cat-dining", "name": "Dining", "icon": "🍽️", "color": "#FB8500"},
        {"id": "cat-transport", "name": "Transport", "icon": "🚗", "color": "#3B82F6"},
        {"id": "cat-shopping", "name": "Shopping", "icon": "🛍️", "color": "#A855F7"},
        {"id": "cat-bills", "name": "Bills", "icon": "📄", "color": "#6B7280"},
        {"id": "cat-health", "name": "Health", "icon": "❤️", "color": "#EF4444"},
        {"id": "cat-entertainment", "name": "Entertainment", "icon": "⭐", "color": "#F59E0B"},
        {"id": "cat-travel", "name": "Travel", "icon": "✈️", "color": "#06B6D4"},
        {"id": "cat-school", "name": "School", "icon": "🎒", "color": "#2386F6"},
    ]
    tags = [
        {"id": "tag-family", "name": "Family", "color": "#16A34A"},
        {"id": "tag-kids", "name": "Kids", "color": "#2386F6"},
        {"id": "tag-subscription", "name": "Subscription", "color": "#A855F7"},
        {"id": "tag-work", "name": "Work", "color": "#F59E0B"},
    ]
    return {
        "categories": categories,
        "tags": tags,
        "budget": {
            "id": "budget-demo",
            "period": "monthly",
            "limit": 3200,
            "warningThreshold": 2600,
            "categoryAllocations": {
                "cat-groceries": 900,
                "cat-dining": 350,
                "cat-transport": 450,
                "cat-shopping": 350,
                "cat-bills": 800,
                "cat-health": 200,
                "cat-entertainment": 150,
            },
            "warningNotifications": True,
            "overBudgetAlerts": True,
        },
        "watchlistItems": [
            {
                "id": "watch-coffee-beans",
                "name": "Lavazza Coffee Beans",
                "merchant": "Coles",
                "targetPrice": 15,
                "currentPrice": 18,
                "originalPrice": 24,
                "status": "on_sale",
                "lastCheckedAt": today_iso(),
            },
            {
                "id": "watch-nappies",
                "name": "Huggies Nappies",
                "merchant": "Chemist Warehouse",
                "targetPrice": 28,
                "currentPrice": 31,
                "originalPrice": 38,
                "status": "watching",
                "lastCheckedAt": today_iso(),
            },
            {
                "id": "watch-rice",
                "name": "Jasmine Rice 5kg",
                "merchant": "Woolworths",
                "targetPrice": 13,
                "currentPrice": 12.5,
                "originalPrice": 17,
                "status": "new_deal",
                "lastCheckedAt": today_iso(),
            },
        ],
        "deals": [
            {
                "id": "deal-coffee-beans",
                "watchlistItemId": "watch-coffee-beans",
                "name": "Lavazza Coffee Beans",
                "merchant": "Coles",
                "originalPrice": 24,
                "salePrice": 18,
                "discountPercent": 25,
                "foundAt": today_iso(),
                "actionStatus": "new",
            },
            {
                "id": "deal-rice",
                "watchlistItemId": "watch-rice",
                "name": "Jasmine Rice 5kg",
                "merchant": "Woolworths",
                "originalPrice": 17,
                "salePrice": 12.5,
                "discountPercent": 26,
                "foundAt": today_iso(),
                "actionStatus": "keep_watching",
            },
        ],
        "shoppingList": [
            {
                "id": "shop-bananas",
                "name": "Bananas",
                "merchant": "Coles",
                "expectedPrice": 4.5,
                "checked": False,
                "date": today_iso(),
            },
            {
                "id": "shop-coffee",
                "dealId": "deal-coffee-beans",
                "name": "Lavazza Coffee Beans",
                "merchant": "Coles",
                "expectedPrice": 18,
                "checked": False,
                "date": today_iso(),
            },
        ],
        "settings": {
            "useMembersAsTags": True,
            "suggestMemberFromHistory": True,
            "currency": "AUD",
            "defaultReportView": "monthly",
            "incomeMemberIds": [you_id, sam_id],
            "notificationsEnabled": False,
            "alertTypeAmount": True,
            "alertTypePercentage": True,
        },
        "incomeSources": [
            {"id": "incsrc-salary", "name": "Salary", "color": "#2386F6"},
            {"id": "incsrc-freelance", "name": "Freelance", "color": "#16A34A"},
            {"id": "incsrc-centrelink", "name": "Family Benefit", "color": "#A855F7"},
        ],
        "incomeItems": [
            {
                "id": "income-freelance-current",
                "date": day(-5),
                "sourceId": "incsrc-freelance",
                "amount": 420,
                "memberId": you_id,
                "notes": "Weekend design project",
            },
            {
                "id": "income-benefit-current",
                "date": day(-12),
                "sourceId": "incsrc-centrelink",
                "amount": 180,
                "memberId": sam_id,
                "notes": "Family benefit",
            },
        ],
        "ongoingIncomes": [
            {
                "id": "ongoing-salary-you",
                "sourceId": "incsrc-salary",
                "amount": 6200,
                "memberId": you_id,
                "notes": "Monthly salary",
                "enabled": True,
            },
            {
                "id": "ongoing-salary-sam",
                "sourceId": "incsrc-salary",
                "amount": 3800,
                "memberId": sam_id,
                "notes": "Part-time salary",
                "enabled": True,
            },
        ],
        "budgetGoals": [
            {"id": "goal-groceries", "categoryId": "cat-groceries", "targetAmount": 850, "period": "monthly"},
            {"id": "goal-dining", "categoryId": "cat-dining", "targetAmount": 300, "period": "monthly"},
        ],
        "recurringTransactions": [
            {
                "id": "recurring-rent",
                "frequency": "monthly",
                "startDate": day(-90),
                "enabled": True,
                "dayOfMonth": 1,
                "nextDueDate": day(7),
                "expense": {
                    "amount": 1450,
                    "merchant": "Rent",
                    "categoryId": "cat-bills",
                    "tagIds": ["tag-family"],
                    "memberId": you_id,
                    "notes": "Monthly rent",
                    "source": "recurring",
                },
            },
            {
                "id": "recurring-netflix",
                "frequency": "monthly",
                "startDate": day(-60),
                "enabled": True,
                "dayOfMonth": 15,
                "nextDueDate": day(21),
                "expense": {
                    "amount": 22.99,
                    "merchant": "Netflix",
                    "categoryId": "cat-entertainment",
                    "tagIds": ["tag-subscription"],
                    "memberId": sam_id,
                    "notes": "Streaming subscription",
                    "source": "recurring",
                },
            },
        ],
        "spendingAlerts": [
            {
                "id": "alert-groceries-80",
                "categoryId": "cat-groceries",
                "threshold": 80,
                "alertType": "percentage",
            },
            {"id": "alert-dining-300", "categoryId": "cat-dining", "threshold": 300, "alertType": "amount"},
        ],
    }


def mock_expenses(
    household_id: uuid.UUID, user_id: uuid.UUID, personas: dict[str, HouseholdPersona]
) -> list[Expense]:
    rows = [
        (
            "groceries-1",
            -1,
            137.42,
            "Coles Rundle Place",
            "cat-groceries",
            ["tag-family"],
            "sam",
            "Weekly groceries",
        ),
        ("dining-1", -2, 46.8, "Betty's Burgers", "cat-dining", ["tag-family"], "you", "Dinner after soccer"),
        ("transport-1", -3, 72.1, "Ampol", "cat-transport", [], "you", "Fuel"),
        ("bills-1", -4, 184.95, "Origin Energy", "cat-bills", ["tag-family"], "sam", "Electricity bill"),
        ("school-1", -5, 59.4, "Officeworks", "cat-school", ["tag-kids"], "mia", "School supplies"),
        ("health-1", -7, 38.5, "Chemist Warehouse", "cat-health", ["tag-kids"], "noah", "Medicine"),
        ("groceries-2", -9, 89.2, "Woolworths", "cat-groceries", ["tag-family"], "you", "Top-up shop"),
        ("shopping-1", -11, 64.0, "Kmart", "cat-shopping", ["tag-kids"], "sam", "Kids clothes"),
        (
            "entertainment-1",
            -14,
            22.99,
            "Netflix",
            "cat-entertainment",
            ["tag-subscription"],
            "sam",
            "Monthly subscription",
        ),
        ("dining-2", -18, 18.2, "Local Cafe", "cat-dining", ["tag-work"], "you", "Coffee meeting"),
        ("transport-2", -22, 31.45, "Uber", "cat-transport", [], "you", "Airport ride"),
        ("groceries-3", -29, 112.75, "Aldi", "cat-groceries", ["tag-family"], "sam", "Monthly pantry stock"),
    ]
    return [
        Expense(
            id=stable_uuid(household_id, f"expense:{label}"),
            household_id=household_id,
            persona_id=personas[persona_key].id,
            category_id=category_id,
            amount=amount,
            date=dt(offset),
            merchant=merchant,
            tag_ids=tag_ids,
            notes=notes,
            source="manual",
            created_by=user_id,
        )
        for label, offset, amount, merchant, category_id, tag_ids, persona_key, notes in rows
    ]


def mock_receipts(
    household_id: uuid.UUID,
    user_id: uuid.UUID,
    personas: dict[str, HouseholdPersona],
) -> tuple[list[Receipt], list[ReceiptItem], list[Expense]]:
    receipt_id = stable_uuid(household_id, "receipt:coles-demo")
    items = [
        ("milk", "Milk 2L", 3.3, "cat-groceries", ["tag-family"], "sam"),
        ("bread", "Sourdough Bread", 5.2, "cat-groceries", ["tag-family"], "sam"),
        ("apples", "Pink Lady Apples", 6.4, "cat-groceries", ["tag-kids"], "mia"),
        ("chicken", "Roast Chicken", 11.5, "cat-groceries", ["tag-family"], "you"),
        ("yoghurt", "Greek Yoghurt", 7.1, "cat-groceries", ["tag-kids"], "noah"),
    ]
    receipt = Receipt(
        id=receipt_id,
        household_id=household_id,
        upload_id=None,
        merchant="Coles Rundle Place",
        date=dt(-1),
        total=sum(row[2] for row in items),
        image_url=None,
        ocr_text="Coles Rundle Place\nMilk 2L 3.30\nSourdough Bread 5.20\nPink Lady Apples 6.40",
        status="processed",
        created_by=user_id,
    )
    receipt_items = [
        ReceiptItem(
            id=stable_uuid(household_id, f"receipt-item:coles:{label}"),
            receipt_id=receipt_id,
            household_id=household_id,
            persona_id=personas[persona_key].id,
            name=name,
            amount=amount,
            category_id=category_id,
            tag_ids=tag_ids,
            ai_confidence=0.91,
            manually_edited=False,
        )
        for label, name, amount, category_id, tag_ids, persona_key in items
    ]
    expenses = [
        Expense(
            id=stable_uuid(household_id, f"receipt-expense:coles:{label}"),
            household_id=household_id,
            persona_id=personas[persona_key].id,
            category_id=category_id,
            amount=amount,
            date=dt(-1),
            merchant=name,
            tag_ids=tag_ids,
            notes="From demo receipt",
            receipt_id=receipt_id,
            source="receipt_ai",
            created_by=user_id,
        )
        for label, name, amount, category_id, tag_ids, persona_key in items
    ]
    return [receipt], receipt_items, expenses


async def seed_normalized_rows(
    session,
    household_id: uuid.UUID,
    user_id: uuid.UUID,
    personas: dict[str, HouseholdPersona],
) -> tuple[int, int, int]:
    receipt_rows, item_rows, receipt_expenses = mock_receipts(household_id, user_id, personas)
    expense_rows = mock_expenses(household_id, user_id, personas) + receipt_expenses

    expense_ids = [row.id for row in expense_rows]
    item_ids = [row.id for row in item_rows]
    receipt_ids = [row.id for row in receipt_rows]

    await session.execute(delete(Expense).where(Expense.id.in_(expense_ids)))
    await session.execute(delete(ReceiptItem).where(ReceiptItem.id.in_(item_ids)))
    await session.execute(delete(Receipt).where(Receipt.id.in_(receipt_ids)))
    await session.flush()

    for receipt in receipt_rows:
        session.add(receipt)
    await session.flush()
    for item in item_rows:
        session.add(item)
    for expense in expense_rows:
        session.add(expense)
    await session.flush()
    return len(expense_rows), len(receipt_rows), len(item_rows)


async def seed_sync_data(session, household_id: uuid.UUID, personas: dict[str, HouseholdPersona]) -> int:
    chunks = await sync_chunks(session, household_id)
    document = mock_sync_document(personas)
    changed = 0
    for key, data in document.items():
        chunk = chunks[key]
        if chunk.data != data:
            chunk.data = data
            changed += 1

    meta = await session.scalar(
        select(HouseholdSyncMeta).where(HouseholdSyncMeta.household_id == household_id)
    )
    if not meta:
        meta = HouseholdSyncMeta(household_id=household_id, revision=1)
        session.add(meta)
    if changed:
        meta.revision = (meta.revision or 0) + 1
    await session.flush()
    return changed


async def run(
    *,
    email: str,
    password: str,
    name: str,
    household_name: str,
    force: bool,
) -> None:
    if len(password) < 8:
        raise ValueError("password must be at least 8 characters")

    async with async_session_factory() as session:
        user, membership = await get_or_create_user(
            session,
            email=email,
            password=password,
            name=name,
            household_name=household_name,
            force=force,
        )
        household_id = membership.household_id

        account_persona = await session.scalar(
            select(HouseholdPersona).where(HouseholdPersona.id == membership.persona_id)
        )
        if not account_persona:
            account_persona = await get_or_create_persona(
                session,
                household_id,
                name=name,
                relationship="You",
                avatar="🧑",
            )
            membership.persona_id = account_persona.id
            membership.is_account_holder = True
        account_persona.name = name
        account_persona.relation_label = "You"
        account_persona.avatar = "🧑"
        account_persona.is_default = True

        personas = {
            "you": account_persona,
            "sam": await get_or_create_persona(
                session, household_id, name="Sam", relationship="Partner", avatar="👩"
            ),
            "mia": await get_or_create_persona(
                session, household_id, name="Mia", relationship="Child 1", avatar="👧"
            ),
            "noah": await get_or_create_persona(
                session, household_id, name="Noah", relationship="Child 2", avatar="👦"
            ),
        }

        sync_changed = await seed_sync_data(session, household_id, personas)
        expenses, receipts, receipt_items = await seed_normalized_rows(
            session, household_id, user.id, personas
        )
        await session.commit()

        print("Seeded Budgii mock database:")
        print(f"  email:         {user.email}")
        print(f"  password:      {password}")
        print(f"  user_id:       {user.id}")
        print(f"  household_id:  {household_id}")
        print(f"  personas:      {len(personas)}")
        print(f"  sync chunks:   {sync_changed} changed")
        print(f"  expenses:      {expenses} upserted")
        print(f"  receipts:      {receipts} upserted")
        print(f"  receipt items: {receipt_items} upserted")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed a realistic Budgii mock dataset")
    parser.add_argument("--email", default=DEFAULT_EMAIL)
    parser.add_argument("--password", default=DEFAULT_PASSWORD)
    parser.add_argument("--name", default=DEFAULT_NAME)
    parser.add_argument("--household", default=DEFAULT_HOUSEHOLD)
    parser.add_argument("--force", action="store_true", help="Delete and recreate the user before seeding")
    args = parser.parse_args()

    asyncio.run(
        run(
            email=args.email,
            password=args.password,
            name=args.name,
            household_name=args.household,
            force=args.force,
        )
    )


if __name__ == "__main__":
    main()
