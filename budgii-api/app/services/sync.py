import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HouseholdDocument
from app.services.household import require_membership
from app.services.seed import SYNC_KEYS


async def get_document(session: AsyncSession, household_id: uuid.UUID) -> HouseholdDocument:
    document = await session.get(HouseholdDocument, household_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household document not found")
    return document


async def pull_snapshot(
    session: AsyncSession,
    user_id: uuid.UUID,
    household_id: uuid.UUID,
    since: datetime | None,
) -> tuple[dict[str, Any], datetime, int]:
    await require_membership(session, user_id, household_id)
    document = await get_document(session, household_id)

    updated_at = document.updated_at
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    if since is not None:
        if since.tzinfo is None:
            since = since.replace(tzinfo=timezone.utc)
        if updated_at <= since:
            return {}, updated_at, document.revision

    return dict(document.data), updated_at, document.revision


async def push_changes(
    session: AsyncSession,
    user_id: uuid.UUID,
    household_id: uuid.UUID,
    changes: dict[str, Any],
    base_revision: int | None,
) -> tuple[datetime, list[str]]:
    await require_membership(session, user_id, household_id)
    document = await get_document(session, household_id)

    conflicts: list[str] = []
    if base_revision is not None and base_revision != document.revision:
        conflicts = sorted(changes.keys())
        updated_at = document.updated_at
        if updated_at.tzinfo is None:
            updated_at = updated_at.replace(tzinfo=timezone.utc)
        return updated_at, conflicts

    filtered = {key: value for key, value in changes.items() if key in SYNC_KEYS}
    merged = dict(document.data)
    for key, value in filtered.items():
        merged[key] = value

    document.data = merged
    document.revision += 1
    await session.flush()
    await session.refresh(document)

    updated_at = document.updated_at
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)
    return updated_at, conflicts
