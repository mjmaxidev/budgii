from typing import Literal

AccessRole = Literal["admin", "editor", "viewer"]
EditorLevel = Literal["full", "standard", "limited"]

ACCESS_ROLES: tuple[AccessRole, ...] = ("admin", "editor", "viewer")
EDITOR_LEVELS: tuple[EditorLevel, ...] = ("full", "standard", "limited")

DEFAULT_EDITOR_LEVEL: EditorLevel = "standard"
DEFAULT_INVITE_ROLE: AccessRole = "editor"

# Sync document keys the client may push — familyMembers and familyInvites are server-owned.
# Phase 2 finance records are server-owned through normalized expenses/receipts APIs.
ADMIN_SYNC_KEYS = frozenset(
    {
        "categories",
        "tags",
        "budget",
        "watchlistItems",
        "deals",
        "shoppingList",
        "settings",
        "incomeSources",
        "incomeItems",
        "ongoingIncomes",
        "budgetGoals",
        "recurringTransactions",
        "spendingAlerts",
    }
)

EDITOR_FULL_KEYS = ADMIN_SYNC_KEYS

EDITOR_STANDARD_KEYS = frozenset(
    {
        "shoppingList",
        "watchlistItems",
        "deals",
        "incomeItems",
        "ongoingIncomes",
        "recurringTransactions",
    }
)

EDITOR_LIMITED_KEYS = frozenset()
