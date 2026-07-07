"""Default household sync chunks matching the Budgii client store shape."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HouseholdSyncChunk, HouseholdSyncMeta

DEFAULT_DOCUMENT: dict = {
    "categories": [
        {"id": "cat-groceries", "name": "Groceries", "icon": "🛒", "color": "#16A34A"},
        {"id": "cat-dining", "name": "Dining", "icon": "🍽️", "color": "#FB8500"},
        {"id": "cat-transport", "name": "Transport", "icon": "🚗", "color": "#3B82F6"},
        {"id": "cat-shopping", "name": "Shopping", "icon": "🛍️", "color": "#A855F7"},
        {"id": "cat-bills", "name": "Bills", "icon": "📄", "color": "#6B7280"},
        {"id": "cat-health", "name": "Health", "icon": "❤️", "color": "#EF4444"},
        {"id": "cat-entertainment", "name": "Entertainment", "icon": "⭐", "color": "#F59E0B"},
        {"id": "cat-travel", "name": "Travel", "icon": "✈️", "color": "#06B6D4"},
    ],
    "tags": [],
    "budget": {
        "id": "budget-1",
        "period": "monthly",
        "limit": 2000,
        "warningThreshold": 800,
        "categoryAllocations": {
            "cat-groceries": 300,
            "cat-dining": 150,
            "cat-transport": 150,
            "cat-shopping": 150,
            "cat-bills": 150,
            "cat-health": 100,
            "cat-entertainment": 0,
            "cat-travel": 0,
        },
        "warningNotifications": True,
        "overBudgetAlerts": True,
    },
    "watchlistItems": [],
    "deals": [],
    "shoppingList": [],
    "settings": {
        "useMembersAsTags": True,
        "suggestMemberFromHistory": True,
        "currency": "AUD",
        "defaultReportView": "monthly",
        "incomeMemberIds": [],
        "notificationsEnabled": False,
        "alertTypeAmount": True,
        "alertTypePercentage": True,
    },
    "incomeSources": [
        {"id": "src-salary", "name": "Salary", "color": "#16A34A"},
        {"id": "src-other", "name": "Other", "color": "#6B7280"},
    ],
    "incomeItems": [],
    "ongoingIncomes": [],
    "budgetGoals": [],
    "recurringTransactions": [],
    "spendingAlerts": [],
}

SYNC_KEYS = frozenset(DEFAULT_DOCUMENT.keys())


def seed_household_sync(session: AsyncSession, household_id: uuid.UUID) -> None:
    session.add(HouseholdSyncMeta(household_id=household_id, revision=1))
    for key in SYNC_KEYS:
        session.add(
            HouseholdSyncChunk(
                household_id=household_id,
                chunk_key=key,
                data=DEFAULT_DOCUMENT[key],
            )
        )
