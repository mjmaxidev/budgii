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
    analyzed = analyze_response.json()
    assert analyzed["receipt"]["status"] == "needs_review"
    assert analyzed["receipt"]["merchant"] == "Whole Foods Market"
    assert len(analyzed["items"]) == 6
    assert {row["persona_id"] for row in analyzed["items"]} == {persona_id}

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
