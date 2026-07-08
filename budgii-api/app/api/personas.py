import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import HouseholdMembership, User
from app.schemas.persona import (
    CreatePersonaRequest,
    PersonaListResponse,
    PersonaResponse,
    UpdatePersonaRequest,
)
from app.services import persona as persona_service
from app.services.household import require_membership
from app.services.permissions import require_can_pull

router = APIRouter()


def persona_response(persona, membership_by_persona: dict[uuid.UUID, HouseholdMembership]) -> PersonaResponse:
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


@router.get("", response_model=PersonaListResponse)
async def list_personas(
    household_id: str = Query(min_length=1),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> PersonaListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)

    personas = await persona_service.list_personas(session, household_uuid)
    links = await session.scalars(
        select(HouseholdMembership).where(
            HouseholdMembership.household_id == household_uuid,
            HouseholdMembership.persona_id.is_not(None),
        )
    )
    membership_by_persona = {m.persona_id: m for m in links if m.persona_id}

    return PersonaListResponse(personas=[persona_response(p, membership_by_persona) for p in personas])


@router.post("", response_model=PersonaResponse)
async def create_persona(
    body: CreatePersonaRequest,
    household_id: str = Query(min_length=1),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> PersonaResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    persona = await persona_service.create_persona(
        session,
        membership,
        name=body.name,
        relationship=body.relationship,
        avatar=body.avatar,
        active=body.active,
        is_default=body.is_default,
    )
    return persona_response(persona, {})


@router.patch("/{persona_id}", response_model=PersonaResponse)
async def update_persona(
    persona_id: str,
    body: UpdatePersonaRequest,
    household_id: str = Query(min_length=1),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> PersonaResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    persona_uuid = parse_uuid(persona_id, "persona_id")
    membership = await require_membership(session, user.id, household_uuid)
    persona = await persona_service.update_persona(
        session,
        membership,
        persona_uuid,
        name=body.name,
        relationship=body.relationship,
        avatar=body.avatar,
        active=body.active,
        is_default=body.is_default,
    )
    linked = await session.scalar(
        select(HouseholdMembership).where(HouseholdMembership.persona_id == persona.id)
    )
    membership_by_persona = {linked.persona_id: linked} if linked and linked.persona_id else {}
    return persona_response(persona, membership_by_persona)


@router.delete("/{persona_id}", status_code=204)
async def delete_persona(
    persona_id: str,
    household_id: str = Query(min_length=1),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    household_uuid = parse_uuid(household_id, "household_id")
    persona_uuid = parse_uuid(persona_id, "persona_id")
    membership = await require_membership(session, user.id, household_uuid)
    await persona_service.delete_persona(session, membership, persona_uuid)
