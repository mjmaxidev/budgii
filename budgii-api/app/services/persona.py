import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HouseholdMembership, HouseholdPersona, User
from app.services.permissions import require_persona_admin


async def list_personas(session: AsyncSession, household_id: uuid.UUID) -> list[HouseholdPersona]:
    result = await session.execute(
        select(HouseholdPersona)
        .where(HouseholdPersona.household_id == household_id)
        .order_by(HouseholdPersona.created_at)
    )
    return list(result.scalars().all())


async def get_persona(session: AsyncSession, household_id: uuid.UUID, persona_id: uuid.UUID) -> HouseholdPersona:
    persona = await session.scalar(
        select(HouseholdPersona).where(
            HouseholdPersona.id == persona_id,
            HouseholdPersona.household_id == household_id,
        )
    )
    if not persona:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Persona not found")
    return persona


async def create_persona(
    session: AsyncSession,
    membership: HouseholdMembership,
    *,
    name: str,
    relationship: str,
    avatar: str,
    active: bool = True,
    is_default: bool = False,
) -> HouseholdPersona:
    require_persona_admin(membership)
    if is_default:
        existing = await session.scalars(
            select(HouseholdPersona).where(
                HouseholdPersona.household_id == membership.household_id,
                HouseholdPersona.is_default.is_(True),
            )
        )
        for persona in existing:
            persona.is_default = False

    persona = HouseholdPersona(
        household_id=membership.household_id,
        name=name.strip(),
        relation_label=relationship.strip() or "Family",
        avatar=avatar or "🧑",
        active=active,
        is_default=is_default,
    )
    session.add(persona)
    await session.flush()
    return persona


async def update_persona(
    session: AsyncSession,
    membership: HouseholdMembership,
    persona_id: uuid.UUID,
    *,
    name: str | None = None,
    relationship: str | None = None,
    avatar: str | None = None,
    active: bool | None = None,
    is_default: bool | None = None,
) -> HouseholdPersona:
    require_persona_admin(membership)
    persona = await get_persona(session, membership.household_id, persona_id)

    if name is not None:
        persona.name = name.strip()
    if relationship is not None:
        persona.relation_label = relationship.strip() or "Family"
    if avatar is not None:
        persona.avatar = avatar or "🧑"
    if active is not None:
        persona.active = active
    if is_default is not None:
        if is_default:
            existing = await session.scalars(
                select(HouseholdPersona).where(
                    HouseholdPersona.household_id == membership.household_id,
                    HouseholdPersona.is_default.is_(True),
                    HouseholdPersona.id != persona.id,
                )
            )
            for other in existing:
                other.is_default = False
        persona.is_default = is_default

    await session.flush()
    return persona


async def delete_persona(
    session: AsyncSession,
    membership: HouseholdMembership,
    persona_id: uuid.UUID,
) -> None:
    require_persona_admin(membership)
    persona = await get_persona(session, membership.household_id, persona_id)

    linked = await session.scalar(
        select(HouseholdMembership).where(HouseholdMembership.persona_id == persona.id)
    )
    if linked:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a persona linked to an app user",
        )

    await session.delete(persona)


async def create_account_holder_persona(
    session: AsyncSession,
    household_id: uuid.UUID,
    user: User,
) -> HouseholdPersona:
    persona = HouseholdPersona(
        household_id=household_id,
        name=user.name or user.email.split("@")[0],
        relation_label="You",
        avatar="🧑",
        active=True,
        is_default=True,
    )
    session.add(persona)
    await session.flush()
    return persona


async def create_join_persona(
    session: AsyncSession,
    household_id: uuid.UUID,
    user: User,
) -> HouseholdPersona:
    persona = HouseholdPersona(
        household_id=household_id,
        name=user.name or user.email.split("@")[0],
        relation_label="Family",
        avatar="🧑",
        active=True,
        is_default=False,
    )
    session.add(persona)
    await session.flush()
    return persona
