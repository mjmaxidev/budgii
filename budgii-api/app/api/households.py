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
from app.services.permissions import normalize_editor_level

router = APIRouter()


def household_response(household, membership) -> HouseholdResponse:
    return HouseholdResponse(
        id=str(household.id),
        name=household.name,
        access_role=membership.access_role,
        editor_level=membership.editor_level,
        is_account_holder=membership.is_account_holder,
    )


@router.get("", response_model=HouseholdListResponse)
async def list_households(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdListResponse:
    rows = await household_service.list_households(session, user)
    return HouseholdListResponse(
        households=[household_response(household, membership) for household, membership in rows]
    )


@router.post("", response_model=HouseholdResponse)
async def create_household(
    body: CreateHouseholdRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdResponse:
    household, membership = await household_service.create_household(session, user, body.name)
    return household_response(household, membership)


@router.post("/join", response_model=HouseholdResponse)
async def join_household(
    body: JoinHouseholdRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdResponse:
    household, membership = await household_service.join_household(session, user, body.code)
    return household_response(household, membership)


@router.post("/invites", response_model=InviteResponse)
async def create_invite(
    body: SendInviteRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> InviteResponse:
    household_id = parse_uuid(body.household_id, "household_id") if body.household_id else None
    editor_level = normalize_editor_level(body.access_role, body.editor_level)
    invite = await household_service.create_invite(
        session,
        user,
        body.contact,
        settings,
        household_id,
        access_role=body.access_role,
        editor_level=editor_level,
    )
    return InviteResponse(
        code=invite.code,
        invite_url=household_service.invite_url(settings, invite.code),
        expires_at=invite.expires_at,
        access_role=invite.access_role,
        editor_level=invite.editor_level,
    )
