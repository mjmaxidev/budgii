from pydantic import BaseModel


class ReceiptUploadResponse(BaseModel):
    id: str
    status: str
    filename: str
