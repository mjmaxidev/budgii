from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import User
from app.schemas.household import (
    CreateHouseholdRequest,
    HouseholdListResponse,
    HouseholdResponse,
    InviteResponse,
    JoinHouseholdRequest,
    SendInviteRequest,
)
from app.services import household as household_service

router = APIRouter()


@router.get("", response_model=HouseholdListResponse)
async def list_households(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdListResponse:
    rows = await household_service.list_households(session, user)
    return HouseholdListResponse(
        households=[
            HouseholdResponse(id=str(household.id), name=household.name, role=role)
            for household, role in rows
        ]
    )


@router.post("", response_model=HouseholdResponse)
async def create_household(
    body: CreateHouseholdRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdResponse:
    household, role = await household_service.create_household(session, user, body.name)
    return HouseholdResponse(id=str(household.id), name=household.name, role=role)


@router.post("/join", response_model=HouseholdResponse)
async def join_household(
    body: JoinHouseholdRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdResponse:
    household, role = await household_service.join_household(session, user, body.code)
    return HouseholdResponse(id=str(household.id), name=household.name, role=role)


@router.post("/invites", response_model=InviteResponse)
async def create_invite(
    body: SendInviteRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> InviteResponse:
    household_id = parse_uuid(body.household_id, "household_id") if body.household_id else None
    invite = await household_service.create_invite(session, user, body.contact, settings, household_id)
    return InviteResponse(
        code=invite.code,
        invite_url=household_service.invite_url(settings, invite.code),
        expires_at=invite.expires_at,
    )
