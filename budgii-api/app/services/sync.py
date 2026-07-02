import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HouseholdSyncChunk, HouseholdSyncMeta
from app.services.household import require_membership
from app.services.permissions import allowed_sync_keys, require_can_pull, require_can_push
from app.services.seed import SYNC_KEYS


async def get_sync_meta(session: AsyncSession, household_id: uuid.UUID) -> HouseholdSyncMeta:
    meta = await session.get(HouseholdSyncMeta, household_id)
    if not meta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household sync not found")
    return meta


async def load_snapshot(session: AsyncSession, household_id: uuid.UUID) -> dict[str, Any]:
    chunks = await session.scalars(
        select(HouseholdSyncChunk).where(HouseholdSyncChunk.household_id == household_id)
    )
    return {chunk.chunk_key: chunk.data for chunk in chunks}


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


async def pull_snapshot(
    session: AsyncSession,
    user_id: uuid.UUID,
    household_id: uuid.UUID,
    since: datetime | None,
) -> tuple[dict[str, Any], datetime, int]:
    membership = await require_membership(session, user_id, household_id)
    require_can_pull(membership)
    meta = await get_sync_meta(session, household_id)

    updated_at = _as_utc(meta.updated_at)

    if since is not None:
        since = _as_utc(since)
        if updated_at <= since:
            return {}, updated_at, meta.revision

    snapshot = await load_snapshot(session, household_id)
    return snapshot, updated_at, meta.revision


async def push_changes(
    session: AsyncSession,
    user_id: uuid.UUID,
    household_id: uuid.UUID,
    changes: dict[str, Any],
    base_revision: int | None,
) -> tuple[datetime, list[str]]:
    membership = await require_membership(session, user_id, household_id)
    require_can_push(membership)
    meta = await get_sync_meta(session, household_id)

    conflicts: list[str] = []
    if base_revision is not None and base_revision != meta.revision:
        conflicts = sorted(changes.keys())
        return _as_utc(meta.updated_at), conflicts

    permitted = allowed_sync_keys(membership)
    filtered = {key: value for key, value in changes.items() if key in SYNC_KEYS and key in permitted}

    for key, value in filtered.items():
        chunk = await session.get(HouseholdSyncChunk, (household_id, key))
        if chunk:
            chunk.data = value

    if filtered:
        meta.revision += 1

    await session.flush()
    await session.refresh(meta)

    return _as_utc(meta.updated_at), conflicts
