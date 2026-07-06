import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Expense, HouseholdMembership, HouseholdPersona, ReceiptUpload, User
from app.services.permissions import require_expense_write


async def list_expenses(
    session: AsyncSession,
    household_id: uuid.UUID,
    *,
    since: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Expense], int]:
    filters = [Expense.household_id == household_id]
    if since is not None:
        filters.append(Expense.updated_at > since)

    total = await session.scalar(select(func.count()).select_from(Expense).where(*filters))
    result = await session.scalars(
        select(Expense)
        .where(*filters)
        .order_by(Expense.date.desc(), Expense.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.all()), total or 0


async def get_expense(session: AsyncSession, household_id: uuid.UUID, expense_id: uuid.UUID) -> Expense:
    expense = await session.scalar(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.household_id == household_id,
        )
    )
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


async def ensure_persona(
    session: AsyncSession,
    household_id: uuid.UUID,
    persona_id: uuid.UUID | None,
) -> None:
    if persona_id is None:
        return
    persona = await session.scalar(
        select(HouseholdPersona.id).where(
            HouseholdPersona.id == persona_id,
            HouseholdPersona.household_id == household_id,
        )
    )
    if not persona:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Persona is not in this household")


async def ensure_receipt_upload(
    session: AsyncSession,
    household_id: uuid.UUID,
    receipt_upload_id: uuid.UUID | None,
) -> None:
    if receipt_upload_id is None:
        return
    upload = await session.scalar(
        select(ReceiptUpload.id).where(
            ReceiptUpload.id == receipt_upload_id,
            ReceiptUpload.household_id == household_id,
        )
    )
    if not upload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Receipt upload is not in this household")


async def create_expense(
    session: AsyncSession,
    membership: HouseholdMembership,
    user: User,
    *,
    expense_id: uuid.UUID | None,
    persona_id: uuid.UUID | None,
    category_id: str,
    amount: float,
    date: datetime,
    merchant: str,
    tag_ids: list[str],
    notes: str | None,
    receipt_upload_id: uuid.UUID | None,
    source: str,
) -> Expense:
    require_expense_write(membership)
    await ensure_persona(session, membership.household_id, persona_id)
    await ensure_receipt_upload(session, membership.household_id, receipt_upload_id)

    expense = Expense(
        id=expense_id or uuid.uuid4(),
        household_id=membership.household_id,
        persona_id=persona_id,
        category_id=category_id,
        amount=amount,
        date=date,
        merchant=merchant.strip(),
        tag_ids=tag_ids,
        notes=notes.strip() if notes else None,
        receipt_upload_id=receipt_upload_id,
        source=source,
        created_by=user.id,
    )
    session.add(expense)
    await session.flush()
    await session.refresh(expense)
    return expense


async def update_expense(
    session: AsyncSession,
    membership: HouseholdMembership,
    expense_id: uuid.UUID,
    *,
    persona_id: uuid.UUID | None | object = ...,
    category_id: str | None = None,
    amount: float | None = None,
    date: datetime | None = None,
    merchant: str | None = None,
    tag_ids: list[str] | None = None,
    notes: str | None | object = ...,
    receipt_upload_id: uuid.UUID | None | object = ...,
    source: str | None = None,
) -> Expense:
    require_expense_write(membership)
    expense = await get_expense(session, membership.household_id, expense_id)

    if persona_id is not ...:
        await ensure_persona(session, membership.household_id, persona_id)
        expense.persona_id = persona_id
    if category_id is not None:
        expense.category_id = category_id
    if amount is not None:
        expense.amount = amount
    if date is not None:
        expense.date = date
    if merchant is not None:
        expense.merchant = merchant.strip()
    if tag_ids is not None:
        expense.tag_ids = tag_ids
    if notes is not ...:
        expense.notes = notes.strip() if notes else None
    if receipt_upload_id is not ...:
        await ensure_receipt_upload(session, membership.household_id, receipt_upload_id)
        expense.receipt_upload_id = receipt_upload_id
    if source is not None:
        expense.source = source

    await session.flush()
    await session.refresh(expense)
    return expense


async def delete_expense(
    session: AsyncSession,
    membership: HouseholdMembership,
    expense_id: uuid.UUID,
) -> None:
    require_expense_write(membership)
    expense = await get_expense(session, membership.household_id, expense_id)
    await session.delete(expense)
