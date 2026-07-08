import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import HouseholdMembership, HouseholdPersona, Receipt, ReceiptItem, ReceiptUpload, User
from app.services.ocr import OcrReceiptResult
from app.services.permissions import require_receipt_upload


async def list_receipts(
    session: AsyncSession,
    household_id: uuid.UUID,
    *,
    since: datetime | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Receipt], int]:
    filters = [Receipt.household_id == household_id]
    if since is not None:
        filters.append(Receipt.updated_at > since)

    total = await session.scalar(select(func.count()).select_from(Receipt).where(*filters))
    result = await session.scalars(
        select(Receipt)
        .options(selectinload(Receipt.items))
        .where(*filters)
        .order_by(Receipt.date.desc(), Receipt.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.all()), total or 0


async def get_receipt(session: AsyncSession, household_id: uuid.UUID, receipt_id: uuid.UUID) -> Receipt:
    receipt = await session.scalar(
        select(Receipt)
        .options(selectinload(Receipt.items))
        .where(
            Receipt.id == receipt_id,
            Receipt.household_id == household_id,
        )
    )
    if not receipt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    return receipt


async def ensure_upload(
    session: AsyncSession,
    household_id: uuid.UUID,
    upload_id: uuid.UUID | None,
) -> None:
    if upload_id is None:
        return
    upload = await session.scalar(
        select(ReceiptUpload.id).where(
            ReceiptUpload.id == upload_id,
            ReceiptUpload.household_id == household_id,
        )
    )
    if not upload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Receipt upload is not in this household"
        )


async def get_upload_for_receipt(
    session: AsyncSession,
    household_id: uuid.UUID,
    receipt_id: uuid.UUID,
) -> ReceiptUpload:
    receipt = await get_receipt(session, household_id, receipt_id)
    if receipt.upload_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt file not found")
    upload = await session.scalar(
        select(ReceiptUpload).where(
            ReceiptUpload.id == receipt.upload_id,
            ReceiptUpload.household_id == household_id,
        )
    )
    if not upload:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt file not found")
    return upload


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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Persona is not in this household"
        )


async def create_receipt(
    session: AsyncSession,
    membership: HouseholdMembership,
    user: User,
    *,
    receipt_id: uuid.UUID | None,
    upload_id: uuid.UUID | None,
    merchant: str,
    date: datetime,
    total: float,
    image_url: str | None,
    ocr_text: str | None,
    receipt_status: str,
) -> Receipt:
    require_receipt_upload(membership)
    await ensure_upload(session, membership.household_id, upload_id)

    receipt = Receipt(
        id=receipt_id or uuid.uuid4(),
        household_id=membership.household_id,
        upload_id=upload_id,
        merchant=merchant.strip(),
        date=date,
        total=total,
        image_url=image_url,
        ocr_text=ocr_text,
        status=receipt_status,
        analysis_error=None,
        created_by=user.id,
    )
    session.add(receipt)
    await session.flush()
    await session.refresh(receipt)
    return receipt


async def update_receipt(
    session: AsyncSession,
    membership: HouseholdMembership,
    receipt_id: uuid.UUID,
    *,
    upload_id: uuid.UUID | None | object = ...,
    merchant: str | None = None,
    date: datetime | None = None,
    total: float | None = None,
    image_url: str | None | object = ...,
    ocr_text: str | None | object = ...,
    receipt_status: str | None = None,
) -> Receipt:
    require_receipt_upload(membership)
    receipt = await get_receipt(session, membership.household_id, receipt_id)

    if upload_id is not ...:
        await ensure_upload(session, membership.household_id, upload_id)
        receipt.upload_id = upload_id
    if merchant is not None:
        receipt.merchant = merchant.strip()
    if date is not None:
        receipt.date = date
    if total is not None:
        receipt.total = total
    if image_url is not ...:
        receipt.image_url = image_url
    if ocr_text is not ...:
        receipt.ocr_text = ocr_text
    if receipt_status is not None:
        receipt.status = receipt_status

    await session.flush()
    await session.refresh(receipt)
    return await get_receipt(session, membership.household_id, receipt.id)


async def delete_receipt(
    session: AsyncSession,
    membership: HouseholdMembership,
    receipt_id: uuid.UUID,
) -> None:
    require_receipt_upload(membership)
    receipt = await get_receipt(session, membership.household_id, receipt_id)
    await session.delete(receipt)


async def list_receipt_items(
    session: AsyncSession, household_id: uuid.UUID, receipt_id: uuid.UUID
) -> list[ReceiptItem]:
    await get_receipt(session, household_id, receipt_id)
    result = await session.scalars(
        select(ReceiptItem)
        .where(
            ReceiptItem.household_id == household_id,
            ReceiptItem.receipt_id == receipt_id,
        )
        .order_by(ReceiptItem.created_at)
    )
    return list(result.all())


async def get_receipt_item(
    session: AsyncSession,
    household_id: uuid.UUID,
    receipt_id: uuid.UUID,
    item_id: uuid.UUID,
) -> ReceiptItem:
    item = await session.scalar(
        select(ReceiptItem).where(
            ReceiptItem.id == item_id,
            ReceiptItem.receipt_id == receipt_id,
            ReceiptItem.household_id == household_id,
        )
    )
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt item not found")
    return item


async def create_receipt_item(
    session: AsyncSession,
    membership: HouseholdMembership,
    receipt_id: uuid.UUID,
    *,
    item_id: uuid.UUID | None,
    name: str,
    amount: float,
    category_id: str,
    tag_ids: list[str],
    persona_id: uuid.UUID | None,
    ai_confidence: float,
    manually_edited: bool,
) -> ReceiptItem:
    require_receipt_upload(membership)
    await get_receipt(session, membership.household_id, receipt_id)
    await ensure_persona(session, membership.household_id, persona_id)

    item = ReceiptItem(
        id=item_id or uuid.uuid4(),
        receipt_id=receipt_id,
        household_id=membership.household_id,
        persona_id=persona_id,
        name=name.strip(),
        amount=amount,
        category_id=category_id,
        tag_ids=tag_ids,
        ai_confidence=ai_confidence,
        manually_edited=manually_edited,
    )
    session.add(item)
    await session.flush()
    await session.refresh(item)
    return item


async def analyze_receipt(
    session: AsyncSession,
    membership: HouseholdMembership,
    receipt_id: uuid.UUID,
    *,
    analysis: OcrReceiptResult,
    category_ids: dict[str, str],
    default_category_id: str | None,
    default_persona_id: uuid.UUID | None,
    default_tag_ids: list[str],
) -> tuple[Receipt, list[ReceiptItem]]:
    require_receipt_upload(membership)
    await ensure_persona(session, membership.household_id, default_persona_id)
    receipt = await get_receipt(session, membership.household_id, receipt_id)
    receipt.status = "analyzing"
    receipt.analysis_error = None
    await session.flush()

    existing_items = await session.scalars(
        select(ReceiptItem).where(
            ReceiptItem.household_id == membership.household_id,
            ReceiptItem.receipt_id == receipt_id,
        )
    )
    for item in existing_items.all():
        await session.delete(item)
    await session.flush()

    saved_items: list[ReceiptItem] = []
    for line in analysis.items:
        category_id = category_ids.get(line.category_name) or default_category_id
        if not category_id:
            receipt.status = "failed"
            receipt.analysis_error = "A default category is required"
            await session.flush()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="A default category is required"
            )

        item = ReceiptItem(
            id=uuid.uuid4(),
            receipt_id=receipt_id,
            household_id=membership.household_id,
            persona_id=default_persona_id,
            name=line.name,
            amount=line.amount,
            category_id=category_id,
            tag_ids=default_tag_ids,
            ai_confidence=round(line.confidence, 2),
            manually_edited=False,
        )
        session.add(item)
        saved_items.append(item)

    receipt.merchant = analysis.merchant
    receipt.total = analysis.total
    receipt.ocr_text = analysis.ocr_text
    receipt.status = "needs_review"
    receipt.analysis_error = None
    await session.flush()
    await session.refresh(receipt)
    for item in saved_items:
        await session.refresh(item)

    return await get_receipt(session, membership.household_id, receipt_id), saved_items


async def update_receipt_item(
    session: AsyncSession,
    membership: HouseholdMembership,
    receipt_id: uuid.UUID,
    item_id: uuid.UUID,
    *,
    name: str | None = None,
    amount: float | None = None,
    category_id: str | None = None,
    tag_ids: list[str] | None = None,
    persona_id: uuid.UUID | None | object = ...,
    ai_confidence: float | None = None,
    manually_edited: bool | None = None,
) -> ReceiptItem:
    require_receipt_upload(membership)
    item = await get_receipt_item(session, membership.household_id, receipt_id, item_id)

    if name is not None:
        item.name = name.strip()
    if amount is not None:
        item.amount = amount
    if category_id is not None:
        item.category_id = category_id
    if tag_ids is not None:
        item.tag_ids = tag_ids
    if persona_id is not ...:
        await ensure_persona(session, membership.household_id, persona_id)
        item.persona_id = persona_id
    if ai_confidence is not None:
        item.ai_confidence = ai_confidence
    if manually_edited is not None:
        item.manually_edited = manually_edited

    await session.flush()
    await session.refresh(item)
    return item


async def delete_receipt_item(
    session: AsyncSession,
    membership: HouseholdMembership,
    receipt_id: uuid.UUID,
    item_id: uuid.UUID,
) -> None:
    require_receipt_upload(membership)
    item = await get_receipt_item(session, membership.household_id, receipt_id, item_id)
    await session.delete(item)
