import logging
from dataclasses import dataclass
from typing import Protocol

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


def get_push_provider() -> PushProvider:
    provider = get_settings().push_provider.strip().lower()
    if provider == "log":
        return LogPushProvider()
    raise RuntimeError(f"Unsupported PUSH_PROVIDER: {provider}")


async def send_push_notification(token: NotificationDeviceToken, message: PushMessage) -> bool:
    if not token.enabled:
        return False
    provider = get_push_provider()
    return await provider.send(token, message)
