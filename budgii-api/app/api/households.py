from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.schemas.household import (
    CreateHouseholdRequest,
    HouseholdResponse,
    InviteResponse,
    JoinHouseholdRequest,
    SendInviteRequest,
)

router = APIRouter()


@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_household(_body: CreateHouseholdRequest) -> HouseholdResponse:
    raise HTTPException(status_code=501, detail="Household creation not implemented yet")


@router.post("/join", response_model=HouseholdResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def join_household(body: JoinHouseholdRequest) -> HouseholdResponse:
    raise HTTPException(status_code=501, detail=f"Join with code {body.code.upper()} not implemented yet")


@router.post("/invites", response_model=InviteResponse, status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def create_invite(_body: SendInviteRequest) -> InviteResponse:
    settings = get_settings()
    raise HTTPException(
        status_code=501,
        detail=f"Invite delivery not implemented yet (base URL: {settings.invite_link_base})",
    )
