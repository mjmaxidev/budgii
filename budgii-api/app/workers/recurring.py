import logging
import uuid
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Household, HouseholdMembership, User
from app.services.recurring import apply_due_recurring_transactions

logger = logging.getLogger(__name__)


@dataclass
class RecurringJobSummary:
    due_date: date
    households_scanned: int = 0
    households_applied: int = 0
    applied_count: int = 0
    skipped_count: int = 0
    no_actor_household_ids: list[str] = field(default_factory=list)
    failed_household_ids: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "due_date": self.due_date.isoformat(),
            "households_scanned": self.households_scanned,
            "households_applied": self.households_applied,
            "applied_count": self.applied_count,
            "skipped_count": self.skipped_count,
            "no_actor_household_ids": self.no_actor_household_ids,
            "failed_household_ids": self.failed_household_ids,
        }


async def apply_due_recurring_for_all_households(
    session: AsyncSession,
    due_date: date,
) -> RecurringJobSummary:
    summary = RecurringJobSummary(due_date=due_date)
    household_ids = await list_household_ids(session)
    summary.households_scanned = len(household_ids)

    for household_id in household_ids:
        actor = await recurring_actor(session, household_id)
        if actor is None:
            summary.no_actor_household_ids.append(str(household_id))
            continue

        membership, user = actor
        try:
            async with session.begin_nested():
                expenses, skipped_count, _, _ = await apply_due_recurring_transactions(
                    session,
                    membership,
                    user,
                    due_date,
                )
            summary.applied_count += len(expenses)
            summary.skipped_count += skipped_count
            if expenses:
                summary.households_applied += 1
        except Exception:
            summary.failed_household_ids.append(str(household_id))
            logger.exception("Recurring scheduler failed for household %s", household_id)

    return summary


async def list_household_ids(session: AsyncSession) -> list[uuid.UUID]:
    result = await session.scalars(select(Household.id).order_by(Household.created_at))
    return list(result.all())


async def recurring_actor(
    session: AsyncSession,
    household_id: uuid.UUID,
) -> tuple[HouseholdMembership, User] | None:
    result = await session.execute(
        select(HouseholdMembership, User)
        .join(User, User.id == HouseholdMembership.user_id)
        .where(
            HouseholdMembership.household_id == household_id,
            HouseholdMembership.access_role == "admin",
        )
        .order_by(HouseholdMembership.is_account_holder.desc(), HouseholdMembership.joined_at)
        .limit(1)
    )
    row = result.first()
    return (row[0], row[1]) if row else None
