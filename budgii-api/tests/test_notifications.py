from fastapi.testclient import TestClient

from tests.helpers import auth_headers, bootstrap, create_household, register_user
from tests.test_normalized_finance import create_expense


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
