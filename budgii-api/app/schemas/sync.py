from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SyncPullResponse(BaseModel):
    household_id: str
    server_time: datetime
    revision: int
    snapshot: dict[str, Any]


class SyncPushRequest(BaseModel):
    household_id: str
    client_time: datetime
    base_revision: int | None = None
    changes: dict[str, Any] = Field(default_factory=dict)


class SyncPushResponse(BaseModel):
    accepted: bool
    server_time: datetime
    conflicts: list[str] = Field(default_factory=list)
