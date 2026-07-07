from fastapi.testclient import TestClient

from tests.helpers import auth_headers, bootstrap, create_household, register_user


def test_deal_check_updates_sync_chunks_and_notifications(client: TestClient) -> None:
    admin = register_user(client, "deals")
    household = create_household(client, admin, "Deals")
    revision = bootstrap(client, admin, household["id"]).json()["revision"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": revision,
            "changes": {
                "watchlistItems": [
                    {
                        "id": "watch-coffee",
                        "name": "Coffee Maker",
                        "merchant": "Kitchen Store",
                        "targetPrice": 45,
                        "currentPrice": 80,
                        "status": "watching",
                    }
                ],
                "deals": [],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text

    response = client.post(
        f"/v1/households/{household['id']}/deals/check",
        headers=auth_headers(admin),
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["sync_revision"] == revision + 2
    assert payload["watchlist_items"][0]["lastCheckedAt"]
    assert payload["watchlist_items"][0]["status"] == "on_sale"
    assert payload["watchlist_items"][0]["currentPrice"] == 45
    assert payload["deals"][0]["watchlistItemId"] == "watch-coffee"
    assert payload["deals"][0]["actionStatus"] == "new"
    assert payload["deals"][0]["discountPercent"] == 44

    notifications_response = client.get(
        f"/v1/households/{household['id']}/notifications",
        headers=auth_headers(admin),
    )
    assert notifications_response.status_code == 200, notifications_response.text
    notifications = notifications_response.json()["notifications"]
    assert any(notification["type"] == "price_drop" for notification in notifications)
    assert any("Coffee Maker" in notification["description"] for notification in notifications)
