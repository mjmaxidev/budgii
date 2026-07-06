from fastapi import HTTPException, status

from app.models import HouseholdMembership
from app.models.access import (
    ADMIN_SYNC_KEYS,
    EDITOR_FULL_KEYS,
    EDITOR_LIMITED_KEYS,
    EDITOR_STANDARD_KEYS,
    AccessRole,
    EditorLevel,
)


def normalize_editor_level(access_role: AccessRole, editor_level: EditorLevel | None) -> EditorLevel | None:
    if access_role != "editor":
        return None
    return editor_level or "standard"


def allowed_sync_keys(membership: HouseholdMembership) -> frozenset[str]:
    if membership.access_role == "admin":
        return ADMIN_SYNC_KEYS
    if membership.access_role == "viewer":
        return frozenset()
    level = membership.editor_level or "standard"
    if level == "full":
        return EDITOR_FULL_KEYS
    if level == "standard":
        return EDITOR_STANDARD_KEYS
    return EDITOR_LIMITED_KEYS


def can_pull_sync(membership: HouseholdMembership) -> bool:
    return membership.access_role in ("admin", "editor", "viewer")


def can_push_sync(membership: HouseholdMembership) -> bool:
    return membership.access_role in ("admin", "editor")


def can_manage_members(membership: HouseholdMembership) -> bool:
    return membership.access_role == "admin"


def can_manage_personas(membership: HouseholdMembership) -> bool:
    return membership.access_role == "admin"


def can_upload_receipts(membership: HouseholdMembership) -> bool:
    if membership.access_role == "admin":
        return True
    if membership.access_role != "editor":
        return False
    return (membership.editor_level or "standard") in ("full", "standard")


def can_manage_expenses(membership: HouseholdMembership) -> bool:
    if membership.access_role == "admin":
        return True
    if membership.access_role != "editor":
        return False
    return (membership.editor_level or "standard") in ("full", "standard")


def require_can_pull(membership: HouseholdMembership) -> None:
    if not can_pull_sync(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access household data")


def require_can_push(membership: HouseholdMembership) -> None:
    if not can_push_sync(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Read-only access")


def require_admin(membership: HouseholdMembership) -> None:
    if not can_manage_members(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def require_persona_admin(membership: HouseholdMembership) -> None:
    if not can_manage_personas(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def require_receipt_upload(membership: HouseholdMembership) -> None:
    if not can_upload_receipts(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot upload receipts")


def require_expense_write(membership: HouseholdMembership) -> None:
    if not can_manage_expenses(membership):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit expenses")
