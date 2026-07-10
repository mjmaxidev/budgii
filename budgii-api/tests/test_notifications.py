import asyncio
from datetime import datetime, timezone
from uuid import UUID

from app.db.session import async_session_factory, engine
from app.services.notifications import filter_notifications_for_delivery
from app.workers.push_notifications import dispatch_push_notifications_for_household
from fastapi.testclient import TestClient

from tests.helpers import (
    auth_headers,
    bootstrap,
    create_household,
    create_invite,
    join_household,
    register_user,
)
from tests.test_normalized_finance import create_expense


def test_push_delivery_filter_respects_master_type_and_quiet_hours() -> None:
    now = datetime(2026, 7, 7, 12, 0, tzinfo=timezone.utc)
    notifications = [
        {"id": "alert:warning", "type": "budget_warning"},
        {"id": "alert:exceeded", "type": "budget_exceeded"},
        {"id": "deal:coffee", "type": "price_drop"},
        {"id": "deal:new", "type": "deal_found"},
        {"id": "summary:weekly", "type": "weekly_summary"},
        {"id": "system:unknown", "type": "system_notice"},
    ]

    assert filter_notifications_for_delivery({"notificationsEnabled": False}, notifications, now) == []

    type_filtered = filter_notifications_for_delivery(
        {
            "notificationsEnabled": True,
            "notificationBudgetWarnings": True,
            "notificationBudgetExceeded": False,
            "notificationDeals": False,
            "notificationWeeklySummary": False,
        },
        notifications,
        now,
    )
    assert [notification["id"] for notification in type_filtered] == ["alert:warning", "system:unknown"]

    summary_filtered = filter_notifications_for_delivery(
        {
            "notificationsEnabled": True,
            "notificationBudgetWarnings": False,
            "notificationBudgetExceeded": False,
            "notificationDeals": False,
            "notificationWeeklySummary": True,
        },
        notifications,
        now,
    )
    assert [notification["id"] for notification in summary_filtered] == [
        "summary:weekly",
        "system:unknown",
    ]

    quiet_filtered = filter_notifications_for_delivery(
        {
            "notificationsEnabled": True,
            "notificationQuietHoursEnabled": True,
            "notificationQuietHoursStart": "22:00",
            "notificationQuietHoursEnd": "07:00",
        },
        notifications,
        datetime(2026, 7, 7, 23, 0, tzinfo=timezone.utc),
    )
    assert quiet_filtered == []


def test_notifications_include_active_spending_alert_and_new_deal(client: TestClient) -> None:
    admin = register_user(client, "notifications")
    household = create_household(client, admin, "Notifications")
    revision = bootstrap(client, admin, household["id"]).json()["revision"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": revision,
            "changes": {
                "categories": [{"id": "cat-groceries", "name": "Groceries"}],
                "budget": {"categoryAllocations": {"cat-groceries": 100}},
                "spendingAlerts": [
                    {
                        "id": "alert-groceries",
                        "categoryId": "cat-groceries",
                        "threshold": 80,
                        "alertType": "percentage",
                    }
                ],
                "deals": [
                    {
                        "id": "deal-coffee",
                        "watchlistItemId": "watch-coffee",
                        "name": "Coffee Maker",
                        "merchant": "Kitchen Store",
                        "originalPrice": 80,
                        "salePrice": 45,
                        "discountPercent": 44,
                        "foundAt": "2026-07-07T00:00:00Z",
                        "actionStatus": "new",
                    }
                ],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text

    create_expense(
        client,
        admin,
        household["id"],
        category_id="cat-groceries",
        amount=90,
        merchant="Grocer",
    )

    response = client.get(
        f"/v1/households/{household['id']}/notifications",
        headers=auth_headers(admin),
    )

    assert response.status_code == 200, response.text
    notifications = response.json()["notifications"]
    types = {notification["type"] for notification in notifications}
    assert "budget_warning" in types
    assert "price_drop" in types
    assert any("Groceries" in notification["description"] for notification in notifications)
    assert any("Coffee Maker" in notification["description"] for notification in notifications)


def test_notification_read_state_persists_per_user(client: TestClient) -> None:
    admin = register_user(client, "notification-read")
    household = create_household(client, admin, "Notification Read")
    revision = bootstrap(client, admin, household["id"]).json()["revision"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-08T00:00:00Z",
            "base_revision": revision,
            "changes": {
                "deals": [
                    {
                        "id": "deal-tea",
                        "watchlistItemId": "watch-tea",
                        "name": "Tea Kettle",
                        "merchant": "Kitchen Store",
                        "originalPrice": 60,
                        "salePrice": 40,
                        "discountPercent": 33,
                        "foundAt": "2026-07-08T00:00:00Z",
                        "actionStatus": "new",
                    }
                ],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text

    notifications_response = client.get(
        f"/v1/households/{household['id']}/notifications",
        headers=auth_headers(admin),
    )
    assert notifications_response.status_code == 200, notifications_response.text
    notification = notifications_response.json()["notifications"][0]
    assert notification["read"] is False

    read_response = client.patch(
        f"/v1/households/{household['id']}/notifications/{notification['id']}/read",
        headers=auth_headers(admin),
    )
    assert read_response.status_code == 200, read_response.text
    assert read_response.json() == {"notification_id": notification["id"], "read": True}

    reread_response = client.get(
        f"/v1/households/{household['id']}/notifications",
        headers=auth_headers(admin),
    )
    assert reread_response.status_code == 200, reread_response.text
    assert reread_response.json()["notifications"][0]["read"] is True

    invite = create_invite(client, admin, household["id"], role="viewer")
    viewer = register_user(client, "notification-viewer")
    join_household(client, viewer, invite["code"])

    viewer_response = client.get(
        f"/v1/households/{household['id']}/notifications",
        headers=auth_headers(viewer),
    )
    assert viewer_response.status_code == 200, viewer_response.text
    assert viewer_response.json()["notifications"][0]["read"] is False


def test_notification_device_token_registration_is_scoped_to_user(client: TestClient) -> None:
    admin = register_user(client, "push-token-admin")
    household = create_household(client, admin, "Push Tokens")

    register_response = client.post(
        f"/v1/households/{household['id']}/notifications/device-tokens",
        json={
            "token": "ExponentPushToken[test-admin-device]",
            "platform": "ios",
            "device_id": "iphone-15",
            "app_version": "0.1.0",
        },
        headers=auth_headers(admin),
    )
    assert register_response.status_code == 200, register_response.text
    registered = register_response.json()
    assert registered["platform"] == "ios"
    assert registered["device_id"] == "iphone-15"
    assert registered["enabled"] is True

    duplicate_response = client.post(
        f"/v1/households/{household['id']}/notifications/device-tokens",
        json={
            "token": "ExponentPushToken[test-admin-device]",
            "platform": "ios",
            "device_id": "iphone-15-pro",
            "app_version": "0.1.1",
        },
        headers=auth_headers(admin),
    )
    assert duplicate_response.status_code == 200, duplicate_response.text
    duplicate = duplicate_response.json()
    assert duplicate["id"] == registered["id"]
    assert duplicate["device_id"] == "iphone-15-pro"
    assert duplicate["app_version"] == "0.1.1"

    invite = create_invite(client, admin, household["id"], role="viewer")
    viewer = register_user(client, "push-token-viewer")
    join_household(client, viewer, invite["code"])

    viewer_list_response = client.get(
        f"/v1/households/{household['id']}/notifications/device-tokens",
        headers=auth_headers(viewer),
    )
    assert viewer_list_response.status_code == 200, viewer_list_response.text
    assert viewer_list_response.json()["tokens"] == []

    unregister_response = client.delete(
        f"/v1/households/{household['id']}/notifications/device-tokens/{registered['id']}",
        headers=auth_headers(admin),
    )
    assert unregister_response.status_code == 200, unregister_response.text
    assert unregister_response.json()["enabled"] is False


def test_push_dispatch_sends_once_per_device_token(client: TestClient) -> None:
    admin = register_user(client, "push-dispatch")
    household = create_household(client, admin, "Push Dispatch")
    revision = bootstrap(client, admin, household["id"]).json()["revision"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": revision,
            "changes": {
                "settings": {"notificationsEnabled": True},
                "categories": [{"id": "cat-groceries", "name": "Groceries"}],
                "budget": {"categoryAllocations": {"cat-groceries": 100}},
                "spendingAlerts": [
                    {
                        "id": "alert-groceries",
                        "categoryId": "cat-groceries",
                        "threshold": 80,
                        "alertType": "percentage",
                    }
                ],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text

    token_response = client.post(
        f"/v1/households/{household['id']}/notifications/device-tokens",
        json={
            "token": "ExponentPushToken[test-dispatch-device]",
            "platform": "ios",
            "device_id": "iphone-test",
            "app_version": "0.1.0",
        },
        headers=auth_headers(admin),
    )
    assert token_response.status_code == 200, token_response.text

    create_expense(
        client,
        admin,
        household["id"],
        category_id="cat-groceries",
        amount=90,
        merchant="Grocer",
    )

    run_at = datetime(2026, 7, 7, 12, 0, tzinfo=timezone.utc)
    first_summary, second_summary = asyncio.run(dispatch_household_push_twice(household["id"], run_at))
    assert first_summary["notifications_considered"] == 1
    assert first_summary["tokens_considered"] == 1
    assert first_summary["sent_count"] == 1
    assert first_summary["duplicate_count"] == 0

    assert second_summary["sent_count"] == 0
    assert second_summary["duplicate_count"] == 1


async def dispatch_household_push_twice(household_id: str, run_at: datetime) -> tuple[dict, dict]:
    await engine.dispose()
    async with async_session_factory() as session:
        first_summary = await dispatch_push_notifications_for_household(session, UUID(household_id), run_at)
        await session.commit()
        second_summary = await dispatch_push_notifications_for_household(session, UUID(household_id), run_at)
        await session.commit()
        return first_summary.as_dict(), second_summary.as_dict()
