from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

DevicePlatform = Literal["ios", "android", "web"]


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


class DeviceTokenRegisterRequest(BaseModel):
    token: str = Field(min_length=8, max_length=512)
    platform: DevicePlatform
    device_id: str | None = Field(default=None, max_length=120)
    app_version: str | None = Field(default=None, max_length=64)

    @field_validator("token", "device_id", "app_version", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = str(value).strip()
        return normalized or None

    @field_validator("token")
    @classmethod
    def require_token(cls, value: str | None) -> str:
        if not value:
            raise ValueError("Token is required")
        return value


class DeviceTokenResponse(BaseModel):
    id: str
    platform: str
    device_id: str | None
    app_version: str | None
    enabled: bool
    created_at: datetime
    updated_at: datetime


class DeviceTokenListResponse(BaseModel):
    tokens: list[DeviceTokenResponse]
