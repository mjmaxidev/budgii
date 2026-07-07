import logging
import uuid

from fastapi import HTTPException

from app.config import get_settings
from app.db.session import async_session_factory
from app.services import receipt as receipt_service
from app.services.household import require_membership
from app.services.ocr import get_receipt_ocr_provider

logger = logging.getLogger(__name__)


async def run_receipt_analysis(
    user_id: uuid.UUID,
    household_id: uuid.UUID,
    receipt_id: uuid.UUID,
    *,
    category_ids: dict[str, str],
    default_category_id: str | None,
    default_persona_id: uuid.UUID | None,
    default_tag_ids: list[str],
) -> None:
    async with async_session_factory() as session:
        try:
            membership = await require_membership(session, user_id, household_id)
            receipt = await receipt_service.get_receipt(session, household_id, receipt_id)
            storage_path = None
            if receipt.upload_id is not None:
                upload = await receipt_service.get_upload_for_receipt(session, household_id, receipt_id)
                storage_path = upload.storage_path

            settings = get_settings()
            provider = get_receipt_ocr_provider(
                settings.receipt_ocr_provider,
                openai_api_key=settings.openai_api_key,
                openai_model=settings.receipt_openai_model,
            )
            analysis = await provider.analyze(storage_path)
            await receipt_service.analyze_receipt(
                session,
                membership,
                receipt_id,
                analysis=analysis,
                category_ids=category_ids,
                default_category_id=default_category_id,
                default_persona_id=default_persona_id,
                default_tag_ids=default_tag_ids,
            )
            await session.commit()
        except Exception as exc:
            await session.rollback()
            logger.exception(
                "Receipt analysis failed",
                extra={
                    "household_id": str(household_id),
                    "receipt_id": str(receipt_id),
                    "user_id": str(user_id),
                },
            )
            await mark_receipt_failed(household_id, receipt_id, analysis_error=analysis_error_message(exc))


def analysis_error_message(exc: Exception) -> str:
    if isinstance(exc, HTTPException):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
    message = str(exc).strip()
    if not message:
        message = exc.__class__.__name__
    return message[:300]


async def mark_receipt_failed(household_id: uuid.UUID, receipt_id: uuid.UUID, *, analysis_error: str) -> None:
    async with async_session_factory() as session:
        try:
            receipt = await receipt_service.get_receipt(session, household_id, receipt_id)
            receipt.status = "failed"
            receipt.analysis_error = analysis_error
            await session.commit()
        except Exception:
            await session.rollback()
