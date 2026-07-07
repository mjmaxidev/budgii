import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import Settings
from app.models import Household, HouseholdInvite, HouseholdMembership, User
from app.models.access import DEFAULT_EDITOR_LEVEL, DEFAULT_INVITE_ROLE, AccessRole, EditorLevel
from app.services.permissions import normalize_editor_level, require_admin, require_can_pull
from app.services.persona import create_account_holder_persona, create_join_persona
from app.services.seed import seed_household_sync
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


def membership_label(membership: HouseholdMembership) -> str:
    if membership.access_role == "editor" and membership.editor_level:
        return f"editor:{membership.editor_level}"
    return membership.access_role


async def list_households(session: AsyncSession, user: User) -> list[tuple[Household, HouseholdMembership]]:
    result = await session.execute(
        select(Household, HouseholdMembership)
        .join(HouseholdMembership, HouseholdMembership.household_id == Household.id)
        .where(HouseholdMembership.user_id == user.id)
        .order_by(Household.created_at)
    )
    return list(result.all())


async def create_household(session: AsyncSession, user: User, name: str) -> tuple[Household, HouseholdMembership]:
    household = Household(name=name.strip(), owner_id=user.id)
    session.add(household)
    await session.flush()

    persona = await create_account_holder_persona(session, household.id, user)
    membership = HouseholdMembership(
        household_id=household.id,
        user_id=user.id,
        persona_id=persona.id,
        access_role="admin",
        editor_level=None,
        is_account_holder=True,
    )
    session.add(membership)
    seed_household_sync(session, household.id)
    await session.flush()
    return household, membership


async def create_invite(
    session: AsyncSession,
    user: User,
    contact: str,
    settings: Settings,
    household_id: uuid.UUID | None = None,
    access_role: AccessRole = DEFAULT_INVITE_ROLE,
    editor_level: EditorLevel | None = DEFAULT_EDITOR_LEVEL,
) -> HouseholdInvite:
    if access_role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invites cannot grant admin access")

    if household_id:
        membership = await require_membership(session, user.id, household_id)
        require_admin(membership)
        target_household_id = household_id
    else:
        households = await list_households(session, user)
        if not households:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Create a household before sending invites",
            )
        _, membership = households[0]
        require_admin(membership)
        target_household_id = households[0][0].id

    normalized_level = normalize_editor_level(access_role, editor_level)
    code = invite_code()
    while await session.scalar(select(HouseholdInvite).where(HouseholdInvite.code == code)):
        code = invite_code()

    invite = HouseholdInvite(
        household_id=target_household_id,
        code=code,
        created_by=user.id,
        access_role=access_role,
        editor_level=normalized_level,
        sent_to_contact=str(contact).strip().lower(),
        sent_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    session.add(invite)
    await session.flush()
    return invite


def invite_url(settings: Settings, code: str) -> str:
    return f"{settings.invite_link_base}?code={code}"


def invite_response(invite: HouseholdInvite, settings: Settings) -> dict:
    return {
        "id": str(invite.id),
        "code": invite.code,
        "invite_url": invite_url(settings, invite.code),
        "expires_at": invite.expires_at,
        "access_role": invite.access_role,
        "editor_level": invite.editor_level,
        "sent_to_contact": invite.sent_to_contact,
        "sent_at": invite.sent_at,
        "used_at": invite.used_at,
        "used_by": str(invite.used_by) if invite.used_by else None,
    }


async def list_invites(
    session: AsyncSession,
    user: User,
    household_id: uuid.UUID,
    settings: Settings,
) -> list[dict]:
    membership = await require_membership(session, user.id, household_id)
    require_admin(membership)

    result = await session.scalars(
        select(HouseholdInvite)
        .where(HouseholdInvite.household_id == household_id)
        .order_by(HouseholdInvite.created_at.desc())
    )
    return [invite_response(invite, settings) for invite in result.all()]


async def revoke_invite(
    session: AsyncSession,
    user: User,
    invite_id: uuid.UUID,
) -> None:
    invite = await session.get(HouseholdInvite, invite_id)
    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")

    membership = await require_membership(session, user.id, invite.household_id)
    require_admin(membership)

    if invite.used_at is not None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Invite already used")

    await session.delete(invite)


async def list_members(
    session: AsyncSession,
    user: User,
    household_id: uuid.UUID,
) -> list[tuple[HouseholdMembership, User]]:
    membership = await require_membership(session, user.id, household_id)
    require_can_pull(membership)

    result = await session.execute(
        select(HouseholdMembership, User)
        .join(User, User.id == HouseholdMembership.user_id)
        .where(HouseholdMembership.household_id == household_id)
        .order_by(HouseholdMembership.joined_at)
    )
    return list(result.all())


async def update_member(
    session: AsyncSession,
    actor: User,
    household_id: uuid.UUID,
    target_user_id: uuid.UUID,
    access_role: AccessRole,
    editor_level: EditorLevel | None,
) -> HouseholdMembership:
    actor_membership = await require_membership(session, actor.id, household_id)
    require_admin(actor_membership)

    if access_role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot assign admin role")

    target = await get_user_membership(session, target_user_id, household_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if target.is_account_holder:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change account holder role")

    target.access_role = access_role
    target.editor_level = normalize_editor_level(access_role, editor_level)
    await session.flush()
    return target


async def remove_member(
    session: AsyncSession,
    actor: User,
    household_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> None:
    actor_membership = await require_membership(session, actor.id, household_id)
    require_admin(actor_membership)

    target = await get_user_membership(session, target_user_id, household_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if target.is_account_holder:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove account holder")

    if target.user_id == actor.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself")

    target.persona_id = None
    await session.delete(target)


async def join_household(session: AsyncSession, user: User, code: str) -> tuple[Household, HouseholdMembership]:
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
        return invite.household, existing

    persona = await create_join_persona(session, invite.household_id, user)
    membership = HouseholdMembership(
        household_id=invite.household_id,
        user_id=user.id,
        persona_id=persona.id,
        access_role=invite.access_role,
        editor_level=normalize_editor_level(invite.access_role, invite.editor_level),
        is_account_holder=False,
    )
    session.add(membership)
    invite.used_by = user.id
    invite.used_at = now
    await session.flush()
    return invite.household, membership
