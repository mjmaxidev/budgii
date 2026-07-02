from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import User
from app.schemas.sync import SyncPullResponse, SyncPushRequest, SyncPushResponse
from app.services import sync as sync_service

router = APIRouter()


@router.get("", response_model=SyncPullResponse)
async def pull_sync(
    household_id: str = Query(min_length=1),
    since: datetime | None = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SyncPullResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    snapshot, server_time, revision = await sync_service.pull_snapshot(session, user.id, household_uuid, since)
    return SyncPullResponse(
        household_id=household_id,
        server_time=server_time,
        revision=revision,
        snapshot=snapshot,
    )


@router.post("", response_model=SyncPushResponse)
async def push_sync(
    body: SyncPushRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> SyncPushResponse:
    household_uuid = parse_uuid(body.household_id, "household_id")
    server_time, conflicts = await sync_service.push_changes(
        session,
        user.id,
        household_uuid,
        body.changes,
        body.base_revision,
    )
    return SyncPushResponse(
        accepted=len(conflicts) == 0,
        server_time=server_time,
        conflicts=conflicts,
    )
