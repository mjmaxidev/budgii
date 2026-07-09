from datetime import datetime

from pydantic import BaseModel, Field


class ExpenseResponse(BaseModel):
    id: str
    household_id: str
    persona_id: str | None = None
    category_id: str
    amount: float
    date: datetime
    merchant: str
    tag_ids: list[str] = Field(default_factory=list)
    notes: str | None = None
    receipt_upload_id: str | None = None
    receipt_id: str | None = None
    source: str
    created_at: datetime
    updated_at: datetime


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    limit: int
    offset: int
    total: int


class ApplyRecurringRequest(BaseModel):
    date: datetime | None = None


class ApplyRecurringResponse(BaseModel):
    expenses: list[ExpenseResponse]
    applied_count: int
    skipped_count: int
    applied_recurring_ids: list[str] = Field(default_factory=list)
    recurring_transactions: list[dict] = Field(default_factory=list)


class CreateExpenseRequest(BaseModel):
    id: str | None = None
    persona_id: str | None = None
    category_id: str = Field(min_length=1, max_length=80)
    amount: float = Field(gt=0)
    date: datetime
    merchant: str = Field(default="", max_length=160)
    tag_ids: list[str] = Field(default_factory=list)
    notes: str | None = None
    receipt_upload_id: str | None = None
    receipt_id: str | None = None
    source: str = Field(default="manual", max_length=32)


class UpdateExpenseRequest(BaseModel):
    persona_id: str | None = None
    category_id: str | None = Field(default=None, min_length=1, max_length=80)
    amount: float | None = Field(default=None, gt=0)
    date: datetime | None = None
    merchant: str | None = Field(default=None, max_length=160)
    tag_ids: list[str] | None = None
    notes: str | None = None
    receipt_upload_id: str | None = None
    receipt_id: str | None = None
    source: str | None = Field(default=None, max_length=32)
