import uuid
from datetime import date, datetime, time, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Expense, HouseholdMembership, HouseholdSyncChunk, HouseholdSyncMeta, User
from app.services.expense import ensure_persona
from app.services.permissions import require_expense_write


def generated_expense_id(household_id: uuid.UUID, recurring_id: str, due_date: date) -> uuid.UUID:
    return uuid.uuid5(
        uuid.NAMESPACE_URL, f"budgii:recurring:{household_id}:{recurring_id}:{due_date.isoformat()}"
    )


def due_datetime(due_date: date) -> datetime:
    return datetime.combine(due_date, time.min, tzinfo=timezone.utc)


def is_recurring_due(transaction: dict[str, Any], due_date: date) -> bool:
    if transaction.get("enabled") is False:
        return False

    start_date = parse_date_or_none(transaction.get("startDate"))
    if start_date and due_date < start_date:
        return False

    frequency = transaction.get("frequency")
    if frequency == "daily":
        return True

    if frequency in ("weekly", "biweekly"):
        day_of_week = transaction.get("dayOfWeek")
        if not isinstance(day_of_week, int) and start_date:
            day_of_week = start_date.isoweekday() % 7
        if not isinstance(day_of_week, int):
            return False
        if day_of_week != due_date.isoweekday() % 7:
            return False
        if frequency == "weekly":
            return True
        anchor = start_date or date(1970, 1, 5)
        return weeks_since(anchor, due_date) % 2 == 0

    if frequency == "monthly":
        day_of_month = transaction.get("dayOfMonth")
        return isinstance(day_of_month, int) and is_due_day_of_month(day_of_month, due_date)

    if frequency in ("quarterly", "yearly"):
        day_of_month = transaction.get("dayOfMonth")
        month_of_year = transaction.get("monthOfYear")
        if not isinstance(month_of_year, int) and start_date:
            month_of_year = start_date.month
        if not isinstance(day_of_month, int) or not isinstance(month_of_year, int):
            return False
        if frequency == "yearly" and due_date.month != month_of_year:
            return False
        if frequency == "quarterly" and (due_date.month - month_of_year) % 3 != 0:
            return False
        return is_due_day_of_month(day_of_month, due_date)

    return False


def weeks_since(start_date: date, due_date: date) -> int:
    return (due_date.toordinal() - start_date.toordinal()) // 7


def next_due_date(transaction: dict[str, Any], after_date: date) -> date | None:
    for offset in range(1, 366 * 5):
        candidate = date.fromordinal(after_date.toordinal() + offset)
        if is_recurring_due(transaction, candidate):
            return candidate
    return None


def is_due_day_of_month(day_of_month: int, due_date: date) -> bool:
    return due_date.day == min(day_of_month, last_day_of_month(due_date))


def last_day_of_month(value: date) -> int:
    if value.month == 12:
        next_month = date(value.year + 1, 1, 1)
    else:
        next_month = date(value.year, value.month + 1, 1)
    return next_month.toordinal() - date(value.year, value.month, 1).toordinal()


def valid_expense_payload(expense: Any) -> bool:
    return (
        isinstance(expense, dict)
        and isinstance(expense.get("merchant"), str)
        and bool(expense["merchant"].strip())
        and isinstance(expense.get("categoryId"), str)
        and bool(expense["categoryId"].strip())
        and isinstance(expense.get("amount"), (int, float))
        and expense["amount"] > 0
    )


async def load_recurring_transactions(session: AsyncSession, household_id: uuid.UUID) -> list[dict[str, Any]]:
    chunk = await session.get(HouseholdSyncChunk, (household_id, "recurringTransactions"))
    if not chunk or not isinstance(chunk.data, list):
        return []
    return [transaction for transaction in chunk.data if isinstance(transaction, dict)]


async def apply_due_recurring_transactions(
    session: AsyncSession,
    membership: HouseholdMembership,
    user: User,
    due_date: date,
) -> tuple[list[Expense], int, list[str], list[dict[str, Any]]]:
    require_expense_write(membership)
    transactions = await load_recurring_transactions(session, membership.household_id)

    generated: list[Expense] = []
    applied_recurring_ids: list[str] = []
    updated_transactions: list[dict[str, Any]] = []
    skipped_count = 0
    for transaction in transactions:
        transaction = dict(transaction)
        updated_transactions.append(transaction)
        recurring_id = str(transaction.get("id") or "").strip()
        expense_payload = transaction.get("expense")
        if (
            not recurring_id
            or not is_recurring_due(transaction, due_date)
            or not valid_expense_payload(expense_payload)
        ):
            skipped_count += 1
            continue

        expense_id = generated_expense_id(membership.household_id, recurring_id, due_date)
        existing = await session.get(Expense, expense_id)
        if existing is not None:
            skipped_count += 1
            continue

        persona_id = parse_uuid_or_none(expense_payload.get("memberId") or expense_payload.get("persona_id"))
        await ensure_persona(session, membership.household_id, persona_id)
        expense = Expense(
            id=expense_id,
            household_id=membership.household_id,
            persona_id=persona_id,
            category_id=expense_payload["categoryId"].strip(),
            amount=float(expense_payload["amount"]),
            date=due_datetime(due_date),
            merchant=expense_payload["merchant"].strip(),
            tag_ids=list(expense_payload.get("tagIds") or []),
            notes=expense_payload.get("notes") or None,
            receipt_upload_id=None,
            receipt_id=None,
            source="recurring",
            created_by=user.id,
        )
        session.add(expense)
        generated.append(expense)
        applied_recurring_ids.append(recurring_id)
        transaction["lastAppliedAt"] = due_date.isoformat()
        next_due = next_due_date(transaction, due_date)
        if next_due:
            transaction["nextDueDate"] = next_due.isoformat()
        else:
            transaction.pop("nextDueDate", None)

    if applied_recurring_ids:
        chunk = await session.get(HouseholdSyncChunk, (membership.household_id, "recurringTransactions"))
        if chunk:
            chunk.data = updated_transactions
        meta = await session.get(HouseholdSyncMeta, membership.household_id)
        if meta:
            meta.revision += 1

    await session.flush()
    for expense in generated:
        await session.refresh(expense)
    return generated, skipped_count, applied_recurring_ids, updated_transactions


async def preview_due_recurring_transactions(
    session: AsyncSession,
    household_id: uuid.UUID,
    due_date: date,
) -> tuple[list[dict[str, Any]], int]:
    transactions = await load_recurring_transactions(session, household_id)

    items: list[dict[str, Any]] = []
    skipped_count = 0
    for transaction in transactions:
        recurring_id = str(transaction.get("id") or "").strip()
        expense_payload = transaction.get("expense")
        if (
            not recurring_id
            or not is_recurring_due(transaction, due_date)
            or not valid_expense_payload(expense_payload)
        ):
            skipped_count += 1
            continue

        expense_id = generated_expense_id(household_id, recurring_id, due_date)
        existing = await session.get(Expense, expense_id)
        if existing is not None:
            skipped_count += 1
            continue

        next_due = next_due_date(transaction, due_date)
        items.append(
            {
                "recurring_id": recurring_id,
                "merchant": expense_payload["merchant"].strip(),
                "amount": float(expense_payload["amount"]),
                "category_id": expense_payload["categoryId"].strip(),
                "due_date": due_datetime(due_date),
                "next_due_date": due_datetime(next_due) if next_due else None,
            }
        )

    return items, skipped_count


def parse_uuid_or_none(value: Any) -> uuid.UUID | None:
    if not value:
        return None
    try:
        return uuid.UUID(str(value))
    except ValueError:
        return None


def parse_date_or_none(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return date.fromisoformat(value)
        except ValueError:
            return None
