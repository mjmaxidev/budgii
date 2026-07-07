from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: datetime
    icon: str


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]
