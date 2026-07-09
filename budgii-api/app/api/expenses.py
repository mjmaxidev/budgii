import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.db.session import get_db
from app.models import Expense, User
from app.schemas.expense import (
    ApplyRecurringRequest,
    ApplyRecurringResponse,
    CreateExpenseRequest,
    ExpenseListResponse,
    ExpenseResponse,
    PreviewRecurringResponse,
    UpdateExpenseRequest,
)
from app.services import expense as expense_service
from app.services import recurring as recurring_service
from app.services.household import require_membership
from app.services.permissions import require_can_pull

router = APIRouter()


def parse_optional_uuid(value: str | None, field: str) -> uuid.UUID | None:
    if value is None:
        return None
    return parse_uuid(value, field)


def expense_response(expense: Expense) -> ExpenseResponse:
    return ExpenseResponse(
        id=str(expense.id),
        household_id=str(expense.household_id),
        persona_id=str(expense.persona_id) if expense.persona_id else None,
        category_id=expense.category_id,
        amount=float(expense.amount),
        date=expense.date,
        merchant=expense.merchant,
        tag_ids=list(expense.tag_ids or []),
        notes=expense.notes,
        receipt_upload_id=str(expense.receipt_upload_id) if expense.receipt_upload_id else None,
        receipt_id=str(expense.receipt_id) if expense.receipt_id else None,
        source=expense.source,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
    )


@router.get("/{household_id}/expenses", response_model=ExpenseListResponse)
async def list_expenses(
    household_id: str,
    since: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExpenseListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)

    expenses, total = await expense_service.list_expenses(
        session,
        household_uuid,
        since=since,
        limit=limit,
        offset=offset,
    )
    return ExpenseListResponse(
        expenses=[expense_response(expense) for expense in expenses],
        limit=limit,
        offset=offset,
        total=total,
    )


@router.post("/{household_id}/expenses", response_model=ExpenseResponse)
async def create_expense(
    household_id: str,
    body: CreateExpenseRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    expense = await expense_service.create_expense(
        session,
        membership,
        user,
        expense_id=parse_optional_uuid(body.id, "id"),
        persona_id=parse_optional_uuid(body.persona_id, "persona_id"),
        category_id=body.category_id,
        amount=body.amount,
        date=body.date,
        merchant=body.merchant,
        tag_ids=body.tag_ids,
        notes=body.notes,
        receipt_upload_id=parse_optional_uuid(body.receipt_upload_id, "receipt_upload_id"),
        receipt_id=parse_optional_uuid(body.receipt_id, "receipt_id"),
        source=body.source,
    )
    return expense_response(expense)


@router.post("/{household_id}/recurring/apply", response_model=ApplyRecurringResponse)
async def apply_due_recurring_transactions(
    household_id: str,
    body: ApplyRecurringRequest | None = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ApplyRecurringResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    due_date = (body.date if body and body.date else datetime.now().astimezone()).date()
    (
        expenses,
        skipped_count,
        applied_recurring_ids,
        recurring_transactions,
    ) = await recurring_service.apply_due_recurring_transactions(
        session,
        membership,
        user,
        due_date,
    )
    return ApplyRecurringResponse(
        expenses=[expense_response(expense) for expense in expenses],
        applied_count=len(expenses),
        skipped_count=skipped_count,
        applied_recurring_ids=applied_recurring_ids,
        recurring_transactions=recurring_transactions,
    )


@router.post("/{household_id}/recurring/preview", response_model=PreviewRecurringResponse)
async def preview_due_recurring_transactions(
    household_id: str,
    body: ApplyRecurringRequest | None = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> PreviewRecurringResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_can_pull(membership)
    due_date = (body.date if body and body.date else datetime.now().astimezone()).date()
    items, skipped_count = await recurring_service.preview_due_recurring_transactions(
        session,
        membership.household_id,
        due_date,
    )
    return PreviewRecurringResponse(items=items, due_count=len(items), skipped_count=skipped_count)


@router.patch("/{household_id}/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    household_id: str,
    expense_id: str,
    body: UpdateExpenseRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ExpenseResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    expense_uuid = parse_uuid(expense_id, "expense_id")
    membership = await require_membership(session, user.id, household_uuid)

    persona_id = (
        parse_optional_uuid(body.persona_id, "persona_id") if "persona_id" in body.model_fields_set else ...
    )
    receipt_upload_id = (
        parse_optional_uuid(body.receipt_upload_id, "receipt_upload_id")
        if "receipt_upload_id" in body.model_fields_set
        else ...
    )
    receipt_id = (
        parse_optional_uuid(body.receipt_id, "receipt_id") if "receipt_id" in body.model_fields_set else ...
    )
    notes = body.notes if "notes" in body.model_fields_set else ...

    expense = await expense_service.update_expense(
        session,
        membership,
        expense_uuid,
        persona_id=persona_id,
        category_id=body.category_id,
        amount=body.amount,
        date=body.date,
        merchant=body.merchant,
        tag_ids=body.tag_ids,
        notes=notes,
        receipt_upload_id=receipt_upload_id,
        receipt_id=receipt_id,
        source=body.source,
    )
    return expense_response(expense)


@router.delete("/{household_id}/expenses/{expense_id}", status_code=204)
async def delete_expense(
    household_id: str,
    expense_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    household_uuid = parse_uuid(household_id, "household_id")
    expense_uuid = parse_uuid(expense_id, "expense_id")
    membership = await require_membership(session, user.id, household_uuid)
    await expense_service.delete_expense(session, membership, expense_uuid)
