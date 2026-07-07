from datetime import datetime

from pydantic import BaseModel


class SpendingAlertEvaluationRequest(BaseModel):
    date: datetime | None = None


class SpendingAlertEvaluation(BaseModel):
    id: str
    category_id: str
    alert_type: str
    threshold: float
    spent: float
    limit: float | None = None
    progress: float
    active: bool


class SpendingAlertEvaluationResponse(BaseModel):
    period_start: datetime
    period_end: datetime
    active_count: int
    alerts: list[SpendingAlertEvaluation]
