import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Household, NotificationDeviceToken, NotificationPushDelivery
from app.services.notifications import push_candidate_notifications
from app.services.push import PushMessage, send_push_notification

logger = logging.getLogger(__name__)


@dataclass
class PushDispatchSummary:
    run_at: datetime
    households_scanned: int = 0
    notifications_considered: int = 0
    tokens_considered: int = 0
    sent_count: int = 0
    duplicate_count: int = 0
    failed_count: int = 0
    no_token_household_ids: list[str] = field(default_factory=list)
    failed_household_ids: list[str] = field(default_factory=list)

    def merge(self, other: "PushDispatchSummary") -> None:
        self.households_scanned += other.households_scanned
        self.notifications_considered += other.notifications_considered
        self.tokens_considered += other.tokens_considered
        self.sent_count += other.sent_count
        self.duplicate_count += other.duplicate_count
        self.failed_count += other.failed_count
        self.no_token_household_ids.extend(other.no_token_household_ids)
        self.failed_household_ids.extend(other.failed_household_ids)

    def as_dict(self) -> dict[str, Any]:
        return {
            "run_at": self.run_at.isoformat(),
            "households_scanned": self.households_scanned,
            "notifications_considered": self.notifications_considered,
            "tokens_considered": self.tokens_considered,
            "sent_count": self.sent_count,
            "duplicate_count": self.duplicate_count,
            "failed_count": self.failed_count,
            "no_token_household_ids": self.no_token_household_ids,
            "failed_household_ids": self.failed_household_ids,
        }


async def dispatch_push_notifications_for_all_households(
    session: AsyncSession,
    now: datetime | None = None,
) -> PushDispatchSummary:
    run_at = now or datetime.now(timezone.utc)
    summary = PushDispatchSummary(run_at=run_at)
    household_ids = await list_household_ids(session)

    for household_id in household_ids:
        try:
            async with session.begin_nested():
                household_summary = await dispatch_push_notifications_for_household(
                    session,
                    household_id,
                    run_at,
                )
            summary.merge(household_summary)
        except Exception:
            summary.failed_household_ids.append(str(household_id))
            logger.exception("Push notification dispatch failed for household %s", household_id)

    return summary


async def dispatch_push_notifications_for_household(
    session: AsyncSession,
    household_id: uuid.UUID,
    now: datetime | None = None,
) -> PushDispatchSummary:
    run_at = now or datetime.now(timezone.utc)
    summary = PushDispatchSummary(run_at=run_at, households_scanned=1)
    notifications = await push_candidate_notifications(session, household_id, run_at)
    summary.notifications_considered = len(notifications)
    if not notifications:
        return summary

    tokens = await enabled_device_tokens(session, household_id)
    summary.tokens_considered = len(tokens)
    if not tokens:
        summary.no_token_household_ids.append(str(household_id))
        return summary

    for notification in notifications:
        for token in tokens:
            already_sent = await delivery_exists(session, token.id, str(notification["id"]))
            if already_sent:
                summary.duplicate_count += 1
                continue

            sent = await send_push_notification(token, notification_message(notification, household_id))
            if not sent:
                summary.failed_count += 1
                continue

            session.add(
                NotificationPushDelivery(
                    household_id=household_id,
                    user_id=token.user_id,
                    device_token_id=token.id,
                    notification_id=str(notification["id"]),
                    notification_type=str(notification.get("type") or "unknown"),
                    provider=get_settings().push_provider.strip().lower(),
                )
            )
            summary.sent_count += 1

    return summary


async def list_household_ids(session: AsyncSession) -> list[uuid.UUID]:
    result = await session.scalars(select(Household.id).order_by(Household.created_at))
    return list(result.all())


async def enabled_device_tokens(
    session: AsyncSession,
    household_id: uuid.UUID,
) -> list[NotificationDeviceToken]:
    result = await session.scalars(
        select(NotificationDeviceToken)
        .where(
            NotificationDeviceToken.household_id == household_id,
            NotificationDeviceToken.enabled.is_(True),
        )
        .order_by(NotificationDeviceToken.created_at)
    )
    return list(result.all())


async def delivery_exists(
    session: AsyncSession,
    device_token_id: uuid.UUID,
    notification_id: str,
) -> bool:
    existing = await session.scalar(
        select(NotificationPushDelivery.id).where(
            NotificationPushDelivery.device_token_id == device_token_id,
            NotificationPushDelivery.notification_id == notification_id,
        )
    )
    return existing is not None


def notification_message(notification: dict[str, Any], household_id: uuid.UUID) -> PushMessage:
    return PushMessage(
        title=str(notification.get("title") or "Budgii"),
        body=str(notification.get("description") or "You have a new Budgii notification."),
        data={
            "household_id": str(household_id),
            "notification_id": str(notification.get("id") or ""),
            "notification_type": str(notification.get("type") or "unknown"),
        },
    )
