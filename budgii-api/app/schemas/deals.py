from datetime import datetime
from typing import Any

from pydantic import BaseModel


class DealCheckResponse(BaseModel):
    checked_at: datetime
    server_time: datetime
    sync_revision: int
    watchlist_items: list[dict[str, Any]]
    deals: list[dict[str, Any]]
