import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, parse_uuid
from app.config import Settings, get_settings
from app.db.session import get_db
from app.models import ReceiptUpload, User
from app.schemas.receipts import ReceiptUploadResponse
from app.services.household import require_membership

router = APIRouter()


@router.post("/upload", response_model=ReceiptUploadResponse)
async def upload_receipt(
    household_id: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ReceiptUploadResponse:
    household_uuid = parse_uuid(household_id, "household_id")
    await require_membership(session, user.id, household_uuid)

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
