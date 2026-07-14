import asyncio
import logging
from dataclasses import dataclass
from typing import Protocol

import firebase_admin
from firebase_admin import credentials, messaging

from app.config import get_settings
from app.models import NotificationDeviceToken

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PushMessage:
    title: str
    body: str
    data: dict[str, str] | None = None


class PushProvider(Protocol):
    async def send(self, token: NotificationDeviceToken, message: PushMessage) -> bool: ...


class LogPushProvider:
    async def send(self, token: NotificationDeviceToken, message: PushMessage) -> bool:
        logger.info(
            "push_notification_log_provider",
            extra={
                "household_id": str(token.household_id),
                "user_id": str(token.user_id),
                "platform": token.platform,
                "title": message.title,
            },
        )
        return True


class FcmPushProvider:
    def __init__(self, project_id: str) -> None:
        self.project_id = project_id

    async def send(self, token: NotificationDeviceToken, message: PushMessage) -> bool:
        try:
            await asyncio.to_thread(self._send, token, message)
            return True
        except firebase_admin.exceptions.FirebaseError:
            logger.exception("fcm_push_failed", extra={"token_id": str(token.id), "platform": token.platform})
            return False

    def _send(self, token: NotificationDeviceToken, message: PushMessage) -> None:
        try:
            app = firebase_admin.get_app()
        except ValueError:
            app = firebase_admin.initialize_app(
                credentials.ApplicationDefault(), {"projectId": self.project_id}
            )

        messaging.send(
            messaging.Message(
                token=token.token,
                notification=messaging.Notification(title=message.title, body=message.body),
                data=message.data or {},
                android=messaging.AndroidConfig(priority="high"),
                apns=messaging.APNSConfig(payload=messaging.APNSPayload(aps=messaging.Aps(sound="default"))),
            ),
            app=app,
        )


def get_push_provider() -> PushProvider:
    provider = get_settings().push_provider.strip().lower()
    if provider == "log":
        return LogPushProvider()
    if provider == "fcm":
        return FcmPushProvider(get_settings().fcm_project_id)
    raise RuntimeError(f"Unsupported PUSH_PROVIDER: {provider}")


async def send_push_notification(token: NotificationDeviceToken, message: PushMessage) -> bool:
    if not token.enabled:
        return False
    provider = get_push_provider()
    return await provider.send(token, message)
