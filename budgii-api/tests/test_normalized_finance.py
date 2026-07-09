from fastapi.testclient import TestClient

from tests.helpers import (
    auth_headers,
    bootstrap,
    create_household,
    create_invite,
    join_household,
    register_user,
)

DATE = "2026-07-07T00:00:00Z"


def create_expense(client: TestClient, tokens: dict, household_id: str, **overrides) -> dict:
    body = {
        "category_id": "cat-groceries",
        "amount": 42.75,
        "date": DATE,
        "merchant": "Local Market",
        "tag_ids": ["tag-weekly"],
        "notes": "Dinner supplies",
        "source": "manual",
        **overrides,
    }
    response = client.post(
        f"/v1/households/{household_id}/expenses",
        json=body,
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def create_receipt(client: TestClient, tokens: dict, household_id: str, **overrides) -> dict:
    body = {
        "merchant": "Receipt Shop",
        "date": DATE,
        "total": 18.5,
        "status": "uploaded",
        **overrides,
    }
    response = client.post(
        f"/v1/households/{household_id}/receipts",
        json=body,
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def upload_receipt_file(client: TestClient, tokens: dict, household_id: str) -> dict:
    response = client.post(
        "/v1/receipts/upload",
        data={"household_id": household_id},
        files={"file": ("receipt.jpg", b"fake receipt image", "image/jpeg")},
        headers=auth_headers(tokens),
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_expense_crud_and_viewer_read_only(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Expense CRUD")
    viewer_invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "viewer")
    join_household(client, viewer, viewer_invite["code"])
    persona_id = bootstrap(client, admin, household["id"]).json()["personas"][0]["id"]

    expense = create_expense(client, admin, household["id"], persona_id=persona_id)

    list_response = client.get(
        f"/v1/households/{household['id']}/expenses",
        headers=auth_headers(viewer),
    )
    assert list_response.status_code == 200, list_response.text
    assert list_response.json()["total"] == 1
    assert list_response.json()["expenses"][0]["id"] == expense["id"]

    viewer_create_response = client.post(
        f"/v1/households/{household['id']}/expenses",
        json={
            "category_id": "cat-dining",
            "amount": 12,
            "date": DATE,
            "merchant": "Cafe",
        },
        headers=auth_headers(viewer),
    )
    assert viewer_create_response.status_code == 403
    assert viewer_create_response.json()["detail"] == "Cannot edit expenses"

    update_response = client.patch(
        f"/v1/households/{household['id']}/expenses/{expense['id']}",
        json={"amount": 50.25, "notes": None, "merchant": "Updated Market"},
        headers=auth_headers(admin),
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["amount"] == 50.25
    assert update_response.json()["notes"] is None
    assert update_response.json()["merchant"] == "Updated Market"

    delete_response = client.delete(
        f"/v1/households/{household['id']}/expenses/{expense['id']}",
        headers=auth_headers(admin),
    )
    assert delete_response.status_code == 204

    empty_response = client.get(
        f"/v1/households/{household['id']}/expenses",
        headers=auth_headers(admin),
    )
    assert empty_response.status_code == 200
    assert empty_response.json()["total"] == 0


def test_limited_editor_can_write_expenses_but_not_receipts(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Limited Editor")
    invite = create_invite(client, admin, household["id"], "editor", "limited")
    limited_editor = register_user(client, "limited")
    join_household(client, limited_editor, invite["code"])

    expense = create_expense(client, limited_editor, household["id"], merchant="Allowed Expense")
    assert expense["merchant"] == "Allowed Expense"

    upload_response = client.post(
        "/v1/receipts/upload",
        data={"household_id": household["id"]},
        files={"file": ("receipt.jpg", b"receipt", "image/jpeg")},
        headers=auth_headers(limited_editor),
    )
    assert upload_response.status_code == 403
    assert upload_response.json()["detail"] == "Cannot upload receipts"

    receipt_response = client.post(
        f"/v1/households/{household['id']}/receipts",
        json={
            "merchant": "Blocked Receipt",
            "date": DATE,
            "total": 10,
        },
        headers=auth_headers(limited_editor),
    )
    assert receipt_response.status_code == 403


def test_apply_due_recurring_transactions_is_idempotent(client: TestClient) -> None:
    admin = register_user(client, "recurring-admin")
    household = create_household(client, admin, "Recurring Apply")
    bootstrap_response = bootstrap(client, admin, household["id"])
    assert bootstrap_response.status_code == 200
    revision = bootstrap_response.json()["revision"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": revision,
            "changes": {
                "recurringTransactions": [
                    {
                        "id": "rt-daily",
                        "frequency": "daily",
                        "startDate": "2026-07-07",
                        "enabled": True,
                        "expense": {
                            "merchant": "Daily Coffee",
                            "amount": 4.5,
                            "categoryId": "cat-dining",
                            "tagIds": ["tag-routine"],
                            "notes": "Weekday cup",
                        },
                    },
                    {
                        "id": "rt-weekly",
                        "frequency": "weekly",
                        "startDate": "2026-06-30",
                        "dayOfWeek": 2,
                        "expense": {
                            "merchant": "Tuesday Gym",
                            "amount": 12,
                            "categoryId": "cat-health",
                        },
                    },
                    {
                        "id": "rt-monthly",
                        "frequency": "monthly",
                        "startDate": "2026-07-01",
                        "dayOfMonth": 7,
                        "expense": {
                            "merchant": "Month End Bill",
                            "amount": 55,
                            "categoryId": "cat-bills",
                        },
                    },
                    {
                        "id": "rt-yearly",
                        "frequency": "yearly",
                        "startDate": "2026-07-07",
                        "dayOfMonth": 7,
                        "monthOfYear": 7,
                        "expense": {
                            "merchant": "Annual Renewal",
                            "amount": 99,
                            "categoryId": "cat-bills",
                        },
                    },
                    {
                        "id": "rt-paused",
                        "frequency": "daily",
                        "enabled": False,
                        "expense": {
                            "merchant": "Paused Daily",
                            "amount": 3,
                            "categoryId": "cat-bills",
                        },
                    },
                    {
                        "id": "rt-future",
                        "frequency": "daily",
                        "startDate": "2026-07-08",
                        "expense": {
                            "merchant": "Future Daily",
                            "amount": 3,
                            "categoryId": "cat-bills",
                        },
                    },
                    {
                        "id": "rt-biweekly",
                        "frequency": "biweekly",
                        "startDate": "2026-06-24",
                        "dayOfWeek": 2,
                        "expense": {
                            "merchant": "Skipped Biweekly",
                            "amount": 15,
                            "categoryId": "cat-health",
                        },
                    },
                    {
                        "id": "rt-invalid",
                        "frequency": "weekly",
                        "expense": {
                            "merchant": "Missing Day",
                            "amount": 9,
                            "categoryId": "cat-bills",
                        },
                    },
                ],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text
    assert push_response.json()["accepted"] is True

    apply_response = client.post(
        f"/v1/households/{household['id']}/recurring/apply",
        json={"date": "2026-07-07T00:00:00Z"},
        headers=auth_headers(admin),
    )
    assert apply_response.status_code == 200, apply_response.text
    applied = apply_response.json()
    assert applied["applied_count"] == 4
    assert applied["skipped_count"] == 4
    assert set(applied["applied_recurring_ids"]) == {"rt-daily", "rt-weekly", "rt-monthly", "rt-yearly"}
    assert {expense["merchant"] for expense in applied["expenses"]} == {
        "Annual Renewal",
        "Daily Coffee",
        "Month End Bill",
        "Tuesday Gym",
    }
    assert {expense["source"] for expense in applied["expenses"]} == {"recurring"}
    recurring_by_id = {transaction["id"]: transaction for transaction in applied["recurring_transactions"]}
    assert recurring_by_id["rt-daily"]["lastAppliedAt"] == "2026-07-07"
    assert recurring_by_id["rt-daily"]["nextDueDate"] == "2026-07-08"
    assert recurring_by_id["rt-weekly"]["nextDueDate"] == "2026-07-14"
    assert "lastAppliedAt" not in recurring_by_id["rt-paused"]

    repeat_response = client.post(
        f"/v1/households/{household['id']}/recurring/apply",
        json={"date": "2026-07-07T00:00:00Z"},
        headers=auth_headers(admin),
    )
    assert repeat_response.status_code == 200
    assert repeat_response.json()["applied_count"] == 0

    expenses_response = client.get(
        f"/v1/households/{household['id']}/expenses",
        headers=auth_headers(admin),
    )
    assert expenses_response.status_code == 200
    assert expenses_response.json()["total"] == 4

    viewer_invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "recurring-viewer")
    join_household(client, viewer, viewer_invite["code"])
    viewer_apply_response = client.post(
        f"/v1/households/{household['id']}/recurring/apply",
        json={"date": "2026-07-07T00:00:00Z"},
        headers=auth_headers(viewer),
    )
    assert viewer_apply_response.status_code == 403


def test_evaluate_spending_alerts_from_normalized_expenses(client: TestClient) -> None:
    admin = register_user(client, "alerts-admin")
    household = create_household(client, admin, "Alert Evaluate")
    bootstrap_response = bootstrap(client, admin, household["id"])
    assert bootstrap_response.status_code == 200
    revision = bootstrap_response.json()["revision"]

    push_response = client.post(
        "/v1/sync",
        json={
            "household_id": household["id"],
            "client_time": "2026-07-07T00:00:00Z",
            "base_revision": revision,
            "changes": {
                "spendingAlerts": [
                    {
                        "id": "sa-amount",
                        "categoryId": "cat-groceries",
                        "threshold": 50,
                        "alertType": "amount",
                    },
                    {
                        "id": "sa-percent",
                        "categoryId": "cat-dining",
                        "threshold": 50,
                        "alertType": "percentage",
                    },
                    {
                        "id": "sa-inactive",
                        "categoryId": "cat-bills",
                        "threshold": 90,
                        "alertType": "percentage",
                    },
                ],
            },
        },
        headers=auth_headers(admin),
    )
    assert push_response.status_code == 200, push_response.text
    assert push_response.json()["accepted"] is True

    create_expense(
        client,
        admin,
        household["id"],
        amount=55,
        merchant="Groceries",
        category_id="cat-groceries",
        date="2026-07-07T00:00:00Z",
    )
    create_expense(
        client,
        admin,
        household["id"],
        amount=80,
        merchant="Dining",
        category_id="cat-dining",
        date="2026-07-07T00:00:00Z",
    )
    create_expense(
        client,
        admin,
        household["id"],
        amount=500,
        merchant="Old Groceries",
        category_id="cat-groceries",
        date="2026-06-07T00:00:00Z",
    )

    evaluate_response = client.post(
        f"/v1/households/{household['id']}/spending-alerts/evaluate",
        json={"date": "2026-07-07T00:00:00Z"},
        headers=auth_headers(admin),
    )
    assert evaluate_response.status_code == 200, evaluate_response.text
    result = evaluate_response.json()
    assert result["active_count"] == 2
    alerts = {alert["id"]: alert for alert in result["alerts"]}
    assert alerts["sa-amount"]["active"] is True
    assert alerts["sa-amount"]["spent"] == 55
    assert alerts["sa-percent"]["active"] is True
    assert alerts["sa-percent"]["limit"] == 150
    assert alerts["sa-inactive"]["active"] is False

    viewer_invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "alerts-viewer")
    join_household(client, viewer, viewer_invite["code"])
    viewer_response = client.post(
        f"/v1/households/{household['id']}/spending-alerts/evaluate",
        json={"date": "2026-07-07T00:00:00Z"},
        headers=auth_headers(viewer),
    )
    assert viewer_response.status_code == 200
    assert viewer_response.json()["active_count"] == 2


def test_receipt_upload_analyze_items_and_expense_linking(client: TestClient) -> None:
    admin = register_user(client, "admin")
    household = create_household(client, admin, "Receipt Lifecycle")
    persona_id = bootstrap(client, admin, household["id"]).json()["personas"][0]["id"]
    upload = upload_receipt_file(client, admin, household["id"])
    receipt = create_receipt(
        client,
        admin,
        household["id"],
        upload_id=upload["id"],
        merchant="Uploaded Store",
        total=22.4,
    )

    file_response = client.get(
        f"/v1/receipts/{receipt['id']}/file?household_id={household['id']}",
        headers=auth_headers(admin),
    )
    assert file_response.status_code == 200
    assert file_response.content == b"fake receipt image"

    item_response = client.post(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}/items",
        json={
            "name": "Apples",
            "amount": 4.2,
            "category_id": "cat-groceries",
            "tag_ids": ["tag-fruit"],
            "persona_id": persona_id,
            "ai_confidence": 0.8,
            "manually_edited": True,
        },
        headers=auth_headers(admin),
    )
    assert item_response.status_code == 200, item_response.text
    item = item_response.json()
    assert item["name"] == "Apples"
    assert item["persona_id"] == persona_id

    update_item_response = client.patch(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}/items/{item['id']}",
        json={"name": "Green Apples", "amount": 5.1, "manually_edited": True},
        headers=auth_headers(admin),
    )
    assert update_item_response.status_code == 200
    assert update_item_response.json()["name"] == "Green Apples"

    analyze_response = client.post(
        f"/v1/receipts/{receipt['id']}/analyze",
        json={
            "household_id": household["id"],
            "category_ids": {"Groceries": "cat-groceries", "Dining": "cat-dining"},
            "default_category_id": "cat-other",
            "default_persona_id": persona_id,
            "default_tag_ids": ["tag-ai"],
        },
        headers=auth_headers(admin),
    )
    assert analyze_response.status_code == 200, analyze_response.text
    queued = analyze_response.json()
    assert queued["receipt"]["status"] == "analyzing"
    assert queued["receipt"]["analysis_error"] is None
    assert queued["items"] == []

    status_response = client.get(
        f"/v1/receipts/{receipt['id']}/status?household_id={household['id']}",
        headers=auth_headers(admin),
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "needs_review"
    assert status_response.json()["analysis_error"] is None
    assert status_response.json()["item_count"] == 6

    analyzed_receipt_response = client.get(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}",
        headers=auth_headers(admin),
    )
    assert analyzed_receipt_response.status_code == 200
    assert analyzed_receipt_response.json()["merchant"] == "Whole Foods Market"
    assert analyzed_receipt_response.json()["analysis_error"] is None

    analyzed_items_response = client.get(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}/items",
        headers=auth_headers(admin),
    )
    assert analyzed_items_response.status_code == 200
    analyzed_items = analyzed_items_response.json()["items"]
    assert len(analyzed_items) == 6
    assert {row["persona_id"] for row in analyzed_items} == {persona_id}

    viewer_invite = create_invite(client, admin, household["id"], "viewer")
    viewer = register_user(client, "receipt-viewer")
    join_household(client, viewer, viewer_invite["code"])

    viewer_list_response = client.get(
        f"/v1/households/{household['id']}/receipts",
        headers=auth_headers(viewer),
    )
    assert viewer_list_response.status_code == 200
    assert viewer_list_response.json()["total"] == 1

    viewer_file_response = client.get(
        f"/v1/receipts/{receipt['id']}/file?household_id={household['id']}",
        headers=auth_headers(viewer),
    )
    assert viewer_file_response.status_code == 200
    assert viewer_file_response.content == b"fake receipt image"

    viewer_status_response = client.get(
        f"/v1/receipts/{receipt['id']}/status?household_id={household['id']}",
        headers=auth_headers(viewer),
    )
    assert viewer_status_response.status_code == 200
    assert viewer_status_response.json()["status"] == "needs_review"

    viewer_items_response = client.get(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}/items",
        headers=auth_headers(viewer),
    )
    assert viewer_items_response.status_code == 200
    assert len(viewer_items_response.json()["items"]) == 6

    viewer_create_response = client.post(
        f"/v1/households/{household['id']}/receipts",
        json={"merchant": "Viewer Receipt", "date": DATE, "total": 5},
        headers=auth_headers(viewer),
    )
    assert viewer_create_response.status_code == 403

    viewer_analyze_response = client.post(
        f"/v1/receipts/{receipt['id']}/analyze",
        json={
            "household_id": household["id"],
            "category_ids": {"Groceries": "cat-groceries"},
            "default_category_id": "cat-other",
        },
        headers=auth_headers(viewer),
    )
    assert viewer_analyze_response.status_code == 403

    failed_upload = upload_receipt_file(client, admin, household["id"])
    failed_receipt = create_receipt(
        client,
        admin,
        household["id"],
        upload_id=failed_upload["id"],
        merchant="Missing Category Store",
    )
    failed_analyze_response = client.post(
        f"/v1/receipts/{failed_receipt['id']}/analyze",
        json={
            "household_id": household["id"],
            "category_ids": {},
            "default_category_id": None,
        },
        headers=auth_headers(admin),
    )
    assert failed_analyze_response.status_code == 200, failed_analyze_response.text

    failed_status_response = client.get(
        f"/v1/receipts/{failed_receipt['id']}/status?household_id={household['id']}",
        headers=auth_headers(admin),
    )
    assert failed_status_response.status_code == 200
    assert failed_status_response.json()["status"] == "failed"
    assert failed_status_response.json()["analysis_error"] == "A default category is required"

    linked_expense = create_expense(
        client,
        admin,
        household["id"],
        amount=39.54,
        merchant="Whole Foods Market",
        receipt_id=receipt["id"],
        source="receipt_ai",
    )
    assert linked_expense["receipt_id"] == receipt["id"]

    delete_receipt_response = client.delete(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}",
        headers=auth_headers(admin),
    )
    assert delete_receipt_response.status_code == 204

    missing_items_response = client.get(
        f"/v1/households/{household['id']}/receipts/{receipt['id']}/items",
        headers=auth_headers(admin),
    )
    assert missing_items_response.status_code == 404

    expenses_response = client.get(
        f"/v1/households/{household['id']}/expenses",
        headers=auth_headers(admin),
    )
    assert expenses_response.status_code == 200
    assert expenses_response.json()["expenses"][0]["receipt_id"] is None
