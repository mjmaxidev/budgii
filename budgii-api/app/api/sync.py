from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.sync import SyncPullResponse, SyncPushRequest, SyncPushResponse

router = APIRouter()


@router.get("", response_model=SyncPullResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def pull_sync(
    household_id: str = Query(min_length=1),
    since: datetime | None = None,
) -> SyncPullResponse:
    raise HTTPException(
        status_code=501,
        detail=f"Sync pull not implemented yet for household {household_id} (since={since})",
    )


@router.post("", response_model=SyncPushResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def push_sync(_body: SyncPushRequest) -> SyncPushResponse:
    raise HTTPException(status_code=501, detail="Sync push not implemented yet")
