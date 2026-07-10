from datetime import datetime
from typing import Any

from pydantic import BaseModel


class BackgroundJobRunResponse(BaseModel):
    id: str
    job_name: str
    status: str
    started_at: datetime
    finished_at: datetime
    summary: dict[str, Any] | None
    error: str | None


class BackgroundJobStatusResponse(BaseModel):
    runs: list[BackgroundJobRunResponse]
