from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class SyncPullResponse(BaseModel):
    household_id: str
    server_time: datetime
    snapshot: dict[str, Any]


class SyncPushRequest(BaseModel):
    household_id: str
    client_time: datetime
    changes: dict[str, Any] = Field(default_factory=dict)


class SyncPushResponse(BaseModel):
    accepted: bool
    server_time: datetime
    conflicts: list[str] = Field(default_factory=list)
