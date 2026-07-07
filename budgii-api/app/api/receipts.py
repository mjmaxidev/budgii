import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import Receipt, ReceiptItem, ReceiptUpload, User
from app.schemas.receipts import (
    CreateReceiptItemRequest,
    CreateReceiptRequest,
    ReceiptAnalyzeRequest,
    ReceiptAnalyzeResponse,
    ReceiptItemListResponse,
    ReceiptItemResponse,
    ReceiptListResponse,
    ReceiptResponse,
    ReceiptStatusResponse,
    ReceiptUploadResponse,
    UpdateReceiptItemRequest,
    UpdateReceiptRequest,
)
from app.services import receipt as receipt_service
from app.services.household import require_membership
from app.services.permissions import require_receipt_upload

router = APIRouter()
household_router = APIRouter()


def parse_optional_uuid(value: str | None, field: str) -> uuid.UUID | None:
    if value is None:
        return None
    return parse_uuid(value, field)


def receipt_response(receipt: Receipt) -> ReceiptResponse:
    items = receipt.__dict__.get("items", [])
    return ReceiptResponse(
        id=str(receipt.id),
        household_id=str(receipt.household_id),
        upload_id=str(receipt.upload_id) if receipt.upload_id else None,
        merchant=receipt.merchant,
        date=receipt.date,
        total=float(receipt.total),
        image_url=receipt.image_url,
        ocr_text=receipt.ocr_text,
        status=receipt.status,
        item_ids=[str(item.id) for item in items],
        created_at=receipt.created_at,
        updated_at=receipt.updated_at,
    )


def receipt_item_response(item: ReceiptItem) -> ReceiptItemResponse:
    return ReceiptItemResponse(
        id=str(item.id),
        receipt_id=str(item.receipt_id),
        name=item.name,
        amount=float(item.amount),
        category_id=item.category_id,
        tag_ids=list(item.tag_ids or []),
        persona_id=str(item.persona_id) if item.persona_id else None,
        ai_confidence=float(item.ai_confidence),
        manually_edited=item.manually_edited,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.post("/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    household_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ReceiptUploadResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_receipt_upload(membership)

    upload_dir = Path(settings.receipt_storage_path) / str(household_uuid)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename or "receipt.jpg").name
    upload_id = uuid.uuid4()
    storage_path = upload_dir / f"{upload_id}_{safe_name}"

    content = await file.read()
    storage_path.write_bytes(content)

    record = ReceiptUpload(
        id=upload_id,
        household_id=household_uuid,
        uploaded_by=user.id,
        filename=safe_name,
        content_type=file.content_type or "application/octet-stream",
        storage_path=str(storage_path),
        status="uploaded",
    )
    session.add(record)
    await session.flush()

    return ReceiptUploadResponse(id=str(record.id), status=record.status, filename=record.filename)


@router.post("/{receipt_id}/analyze", response_model=ReceiptAnalyzeResponse)
async def analyze_receipt(
    receipt_id: str,
    body: ReceiptAnalyzeRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptAnalyzeResponse:
    household_uuid = parse_uuid(body.household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    membership = await require_membership(session, user.id, household_uuid)
    receipt, items = await receipt_service.analyze_receipt(
        session,
        membership,
        receipt_uuid,
        category_ids=body.category_ids,
        default_category_id=body.default_category_id,
        default_persona_id=parse_optional_uuid(body.default_persona_id, "default_persona_id"),
        default_tag_ids=body.default_tag_ids,
    )
    return ReceiptAnalyzeResponse(
        receipt=receipt_response(receipt),
        items=[receipt_item_response(item) for item in items],
    )


@router.get("/{receipt_id}/status", response_model=ReceiptStatusResponse)
async def get_receipt_status(
    receipt_id: str,
    household_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptStatusResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_receipt_upload(membership)
    receipt = await receipt_service.get_receipt(session, household_uuid, receipt_uuid)
    return ReceiptStatusResponse(
        id=str(receipt.id),
        status=receipt.status,
        item_count=len(receipt.items),
        updated_at=receipt.updated_at,
    )


@household_router.get("/{household_id}/receipts", response_model=ReceiptListResponse)
async def list_receipts(
    household_id: str,
    since: datetime | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_receipt_upload(membership)

    receipts, total = await receipt_service.list_receipts(
        session,
        household_uuid,
        since=since,
        limit=limit,
        offset=offset,
    )
    return ReceiptListResponse(
        receipts=[receipt_response(receipt) for receipt in receipts],
        limit=limit,
        offset=offset,
        total=total,
    )


@household_router.post("/{household_id}/receipts", response_model=ReceiptResponse)
async def create_receipt(
    household_id: str,
    body: CreateReceiptRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    membership = await require_membership(session, user.id, household_uuid)
    receipt = await receipt_service.create_receipt(
        session,
        membership,
        user,
        receipt_id=parse_optional_uuid(body.id, "id"),
        upload_id=parse_optional_uuid(body.upload_id, "upload_id"),
        merchant=body.merchant,
        date=body.date,
        total=body.total,
        image_url=body.image_url,
        ocr_text=body.ocr_text,
        receipt_status=body.status,
    )
    return receipt_response(receipt)


@household_router.patch("/{household_id}/receipts/{receipt_id}", response_model=ReceiptResponse)
async def update_receipt(
    household_id: str,
    receipt_id: str,
    body: UpdateReceiptRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    membership = await require_membership(session, user.id, household_uuid)

    upload_id = parse_optional_uuid(body.upload_id, "upload_id") if "upload_id" in body.model_fields_set else ...
    image_url = body.image_url if "image_url" in body.model_fields_set else ...
    ocr_text = body.ocr_text if "ocr_text" in body.model_fields_set else ...

    receipt = await receipt_service.update_receipt(
        session,
        membership,
        receipt_uuid,
        upload_id=upload_id,
        merchant=body.merchant,
        date=body.date,
        total=body.total,
        image_url=image_url,
        ocr_text=ocr_text,
        receipt_status=body.status,
    )
    return receipt_response(receipt)


@household_router.delete("/{household_id}/receipts/{receipt_id}", status_code=204)
async def delete_receipt(
    household_id: str,
    receipt_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    membership = await require_membership(session, user.id, household_uuid)
    await receipt_service.delete_receipt(session, membership, receipt_uuid)


@household_router.get("/{household_id}/receipts/{receipt_id}/items", response_model=ReceiptItemListResponse)
async def list_receipt_items(
    household_id: str,
    receipt_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptItemListResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    membership = await require_membership(session, user.id, household_uuid)
    require_receipt_upload(membership)

    items = await receipt_service.list_receipt_items(session, household_uuid, receipt_uuid)
    return ReceiptItemListResponse(items=[receipt_item_response(item) for item in items])


@household_router.post("/{household_id}/receipts/{receipt_id}/items", response_model=ReceiptItemResponse)
async def create_receipt_item(
    household_id: str,
    receipt_id: str,
    body: CreateReceiptItemRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptItemResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    membership = await require_membership(session, user.id, household_uuid)
    item = await receipt_service.create_receipt_item(
        session,
        membership,
        receipt_uuid,
        item_id=parse_optional_uuid(body.id, "id"),
        name=body.name,
        amount=body.amount,
        category_id=body.category_id,
        tag_ids=body.tag_ids,
        persona_id=parse_optional_uuid(body.persona_id, "persona_id"),
        ai_confidence=body.ai_confidence,
        manually_edited=body.manually_edited,
    )
    return receipt_item_response(item)


@household_router.patch("/{household_id}/receipts/{receipt_id}/items/{item_id}", response_model=ReceiptItemResponse)
async def update_receipt_item(
    household_id: str,
    receipt_id: str,
    item_id: str,
    body: UpdateReceiptItemRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> ReceiptItemResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    item_uuid = parse_uuid(item_id, "item_id")
    membership = await require_membership(session, user.id, household_uuid)
    persona_id = parse_optional_uuid(body.persona_id, "persona_id") if "persona_id" in body.model_fields_set else ...

    item = await receipt_service.update_receipt_item(
        session,
        membership,
        receipt_uuid,
        item_uuid,
        name=body.name,
        amount=body.amount,
        category_id=body.category_id,
        tag_ids=body.tag_ids,
        persona_id=persona_id,
        ai_confidence=body.ai_confidence,
        manually_edited=body.manually_edited,
    )
    return receipt_item_response(item)


@household_router.delete("/{household_id}/receipts/{receipt_id}/items/{item_id}", status_code=204)
async def delete_receipt_item(
    household_id: str,
    receipt_id: str,
    item_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> None:
    household_uuid = parse_uuid(household_id, "household_id")
    receipt_uuid = parse_uuid(receipt_id, "receipt_id")
    item_uuid = parse_uuid(item_id, "item_id")
    membership = await require_membership(session, user.id, household_uuid)
    await receipt_service.delete_receipt_item(session, membership, receipt_uuid, item_uuid)
