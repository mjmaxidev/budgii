import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import Settings
from app.models import Household, HouseholdDocument, HouseholdInvite, HouseholdMembership, User
from app.services.seed import DEFAULT_DOCUMENT
from app.services.security import invite_code


async def get_user_membership(
    session: AsyncSession, user_id: uuid.UUID, household_id: uuid.UUID
) -> HouseholdMembership | None:
    return await session.scalar(
        select(HouseholdMembership).where(
            HouseholdMembership.user_id == user_id,
            HouseholdMembership.household_id == household_id,
        )
    )


async def require_membership(
    session: AsyncSession, user_id: uuid.UUID, household_id: uuid.UUID
) -> HouseholdMembership:
    membership = await get_user_membership(session, user_id, household_id)
    if not membership:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a household member")
    return membership


async def list_households(session: AsyncSession, user: User) -> list[tuple[Household, str]]:
    result = await session.execute(
        select(Household, HouseholdMembership.role)
        .join(HouseholdMembership, HouseholdMembership.household_id == Household.id)
        .where(HouseholdMembership.user_id == user.id)
        .order_by(Household.created_at)
    )
    return list(result.all())


async def create_household(session: AsyncSession, user: User, name: str) -> tuple[Household, str]:
    household = Household(name=name.strip(), owner_id=user.id)
    session.add(household)
    await session.flush()

    session.add(HouseholdMembership(household_id=household.id, user_id=user.id, role="owner"))
    session.add(
        HouseholdDocument(
            household_id=household.id,
            data=dict(DEFAULT_DOCUMENT),
            revision=1,
        )
    )
    await session.flush()
    return household, "owner"


async def create_invite(
    session: AsyncSession,
    user: User,
    contact: str,
    settings: Settings,
    household_id: uuid.UUID | None = None,
) -> HouseholdInvite:
    if household_id:
        await require_membership(session, user.id, household_id)
        target_household_id = household_id
    else:
        households = await list_households(session, user)
        if not households:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Create a household before sending invites",
            )
        target_household_id = households[0][0].id

    code = invite_code()
    while await session.scalar(select(HouseholdInvite).where(HouseholdInvite.code == code)):
        code = invite_code()

    invite = HouseholdInvite(
        household_id=target_household_id,
        code=code,
        created_by=user.id,
        sent_to_contact=contact.strip(),
        sent_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    session.add(invite)
    await session.flush()
    return invite


def invite_url(settings: Settings, code: str) -> str:
    return f"{settings.invite_link_base}?code={code}"


async def join_household(session: AsyncSession, user: User, code: str) -> tuple[Household, str]:
    normalized = code.strip().upper()
    invite = await session.scalar(
        select(HouseholdInvite)
        .options(selectinload(HouseholdInvite.household))
        .where(HouseholdInvite.code == normalized)
    )
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite code not found")

    now = datetime.now(timezone.utc)
    if invite.used_at is not None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite code already used")
    if invite.expires_at < now:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite code expired")

    existing = await get_user_membership(session, user.id, invite.household_id)
    if existing:
        return invite.household, existing.role

    session.add(
        HouseholdMembership(
            household_id=invite.household_id,
            user_id=user.id,
            role="member",
        )
    )
    invite.used_by = user.id
    invite.used_at = now
    await session.flush()
    return invite.household, "member"
