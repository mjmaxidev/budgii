from typing import Literal

from pydantic import BaseModel


class BudgetInsightResponse(BaseModel):
    summary: str
    actions: list[str]
    source: Literal["ai", "deterministic"]
