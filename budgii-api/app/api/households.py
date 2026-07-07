from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import Household, HouseholdMembership, User
from app.schemas.household import (
    CreateHouseholdRequest,
    HouseholdBootstrapResponse,
    HouseholdListResponse,
    HouseholdMemberListResponse,
    HouseholdMemberResponse,
    HouseholdResponse,
    InviteListResponse,
    InviteResponse,
    JoinHouseholdRequest,
    SendInviteRequest,
    UpdateMemberRequest,
)
from app.schemas.persona import PersonaResponse
from app.services import household as household_service
from app.services import persona as persona_service
from app.services import sync as sync_service
from app.services.permissions import normalize_editor_level, require_can_pull

router = APIRouter()


def household_response(household, membership) -> HouseholdResponse:
    return HouseholdResponse(
        id=str(household.id),
        name=household.name,
        access_role=membership.access_role,
        editor_level=membership.editor_level,
        is_account_holder=membership.is_account_holder,
    )


def member_response(membership, user) -> HouseholdMemberResponse:
    return HouseholdMemberResponse(
        user_id=str(user.id),
        persona_id=str(membership.persona_id) if membership.persona_id else None,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        access_role=membership.access_role,
        editor_level=membership.editor_level,
        is_account_holder=membership.is_account_holder,
        joined_at=membership.joined_at,
    )


def persona_response(persona, membership_by_persona) -> PersonaResponse:
    membership = membership_by_persona.get(persona.id)
    return PersonaResponse(
        id=str(persona.id),
        name=persona.name,
        relationship=persona.relation_label,
        avatar=persona.avatar,
        active=persona.active,
        is_default=persona.is_default,
        has_app_access=membership is not None,
        access_role=membership.access_role if membership else None,
        editor_level=membership.editor_level if membership else None,
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


@router.get("/invites", response_model=InviteListResponse)
async def list_invites(
    household_id: str = Query(min_length=1),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> InviteListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    invites = await household_service.list_invites(session, user, household_uuid, settings)
    return InviteListResponse(invites=[InviteResponse(**invite) for invite in invites])


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
    return InviteResponse(**household_service.invite_response(invite, settings))


@router.delete("/invites/{invite_id}", status_code=204)
async def revoke_invite(
    invite_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    invite_uuid = parse_uuid(invite_id, "invite_id")
    await household_service.revoke_invite(session, user, invite_uuid)


@router.get("/{household_id}/bootstrap", response_model=HouseholdBootstrapResponse)
async def bootstrap_household(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> HouseholdBootstrapResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await household_service.require_membership(session, user.id, household_uuid)
    require_can_pull(membership)

    household = await session.get(Household, household_uuid)
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    member_rows = await household_service.list_members(session, user, household_uuid)
    personas = await persona_service.list_personas(session, household_uuid)
    links = await session.scalars(
        select(HouseholdMembership).where(
            HouseholdMembership.household_id == household_uuid,
            HouseholdMembership.persona_id.is_not(None),
        )
    )
    membership_by_persona = {link.persona_id: link for link in links if link.persona_id}

    invites = []
    if membership.access_role == "admin":
        invites = await household_service.list_invites(session, user, household_uuid, settings)

    snapshot, server_time, revision = await sync_service.pull_snapshot(session, user.id, household_uuid, None)

    return HouseholdBootstrapResponse(
        household=household_response(household, membership),
        members=[member_response(member, member_user) for member, member_user in member_rows],
        personas=[persona_response(persona, membership_by_persona) for persona in personas],
        invites=[InviteResponse(**invite) for invite in invites],
        server_time=server_time,
        revision=revision,
        snapshot=snapshot,
    )


@router.get("/{household_id}/members", response_model=HouseholdMemberListResponse)
async def list_members(
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdMemberListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    rows = await household_service.list_members(session, user, household_uuid)
    return HouseholdMemberListResponse(
        members=[member_response(membership, member_user) for membership, member_user in rows]
    )


@router.patch("/{household_id}/members/{user_id}", response_model=HouseholdMemberResponse)
async def update_member(
    household_id: str,
    user_id: str,
    body: UpdateMemberRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> HouseholdMemberResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    target_uuid = parse_uuid(user_id, "user_id")
    editor_level = normalize_editor_level(body.access_role, body.editor_level)
    membership = await household_service.update_member(
        session,
        user,
        household_uuid,
        target_uuid,
        body.access_role,
        editor_level,
    )
    target_user = await session.get(User, target_uuid)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return member_response(membership, target_user)


@router.delete("/{household_id}/members/{user_id}", status_code=204)
async def remove_member(
    household_id: str,
    user_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    household_uuid = parse_uuid(household_id, "household_id")
    target_uuid = parse_uuid(user_id, "user_id")
    await household_service.remove_member(session, user, household_uuid, target_uuid)
