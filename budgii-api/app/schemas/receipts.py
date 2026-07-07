from datetime import datetime

from pydantic import BaseModel, Field


class ReceiptUploadResponse(BaseModel):
    id: str
    status: str
    filename: str


class ReceiptItemResponse(BaseModel):
    id: str
    receipt_id: str
    name: str
    amount: float
    category_id: str
    tag_ids: list[str] = Field(default_factory=list)
    persona_id: str | None = None
    ai_confidence: float
    manually_edited: bool
    created_at: datetime
    updated_at: datetime


class ReceiptResponse(BaseModel):
    id: str
    household_id: str
    upload_id: str | None = None
    merchant: str
    date: datetime
    total: float
    image_url: str | None = None
    ocr_text: str | None = None
    status: str
    item_ids: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ReceiptListResponse(BaseModel):
    receipts: list[ReceiptResponse]
    limit: int
    offset: int
    total: int


class ReceiptItemListResponse(BaseModel):
    items: list[ReceiptItemResponse]


class ReceiptAnalyzeRequest(BaseModel):
    household_id: str
    category_ids: dict[str, str] = Field(default_factory=dict)
    default_category_id: str | None = None
    default_persona_id: str | None = None
    default_tag_ids: list[str] = Field(default_factory=list)


class ReceiptAnalyzeResponse(BaseModel):
    receipt: ReceiptResponse
    items: list[ReceiptItemResponse]


class ReceiptStatusResponse(BaseModel):
    id: str
    status: str
    item_count: int
    updated_at: datetime


class CreateReceiptRequest(BaseModel):
    id: str | None = None
    upload_id: str | None = None
    merchant: str = Field(default="", max_length=160)
    date: datetime
    total: float = Field(ge=0)
    image_url: str | None = None
    ocr_text: str | None = None
    status: str = Field(default="uploaded", max_length=32)


class UpdateReceiptRequest(BaseModel):
    upload_id: str | None = None
    merchant: str | None = Field(default=None, max_length=160)
    date: datetime | None = None
    total: float | None = Field(default=None, ge=0)
    image_url: str | None = None
    ocr_text: str | None = None
    status: str | None = Field(default=None, max_length=32)


class CreateReceiptItemRequest(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=160)
    amount: float = Field(ge=0)
    category_id: str = Field(min_length=1, max_length=80)
    tag_ids: list[str] = Field(default_factory=list)
    persona_id: str | None = None
    ai_confidence: float = Field(default=0, ge=0, le=1)
    manually_edited: bool = False


class UpdateReceiptItemRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    amount: float | None = Field(default=None, ge=0)
    category_id: str | None = Field(default=None, min_length=1, max_length=80)
    tag_ids: list[str] | None = None
    persona_id: str | None = None
    ai_confidence: float | None = Field(default=None, ge=0, le=1)
    manually_edited: bool | None = None
