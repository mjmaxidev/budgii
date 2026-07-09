from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    timestamp: datetime
    icon: str
    read: bool = False


class NotificationListResponse(BaseModel):
    notifications: list[NotificationResponse]


class NotificationReadResponse(BaseModel):
    notification_id: str
    read: bool
