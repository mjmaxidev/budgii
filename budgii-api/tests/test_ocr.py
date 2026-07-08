import pytest
from app.services.ocr import ocr_result_from_payload


def test_ocr_payload_skips_totals_and_merges_duplicate_items() -> None:
    result = ocr_result_from_payload(
        {
            "merchant": "Coles",
            "total": "0",
            "ocr_text": "raw",
            "items": [
                {"name": "Milk", "amount": "$2.50", "category_name": "Groceries", "confidence": "0.7"},
                {"name": "milk", "amount": "1.50", "category_name": "Groceries", "confidence": 0.9},
                {"name": "Tax", "amount": 0.25, "category_name": "Other", "confidence": 0.5},
                {"name": "Total", "amount": 4.25, "category_name": "Other", "confidence": 0.5},
                {"name": "Card", "amount": 4.25, "category_name": "Other", "confidence": 0.5},
            ],
        }
    )

    assert result.merchant == "Coles"
    assert result.total == 4.0
    assert len(result.items) == 1
    assert result.items[0].name == "Milk"
    assert result.items[0].amount == 4.0
    assert result.items[0].confidence == 0.9


def test_ocr_payload_requires_real_line_items() -> None:
    with pytest.raises(ValueError, match="no line items"):
        ocr_result_from_payload(
            {
                "merchant": "Coles",
                "total": 12,
                "ocr_text": "raw",
                "items": [
                    {"name": "Total", "amount": 12, "category_name": "Other", "confidence": 1},
                    {"name": "Tax", "amount": 1, "category_name": "Other", "confidence": 1},
                ],
            }
        )


def test_ocr_payload_skips_merchant_and_payment_noise() -> None:
    result = ocr_result_from_payload(
        {
            "merchant": "Coles Rundle Place",
            "total": 9.5,
            "ocr_text": "Coles Rundle Place\nMilk 2.50\nBread 4.00\nGST 0.59\nEFTPOS 9.50",
            "items": [
                {
                    "name": "Coles Rundle Place",
                    "amount": 2.8,
                    "category_name": "Groceries",
                    "confidence": 0.6,
                },
                {"name": "Milk 2L", "amount": 2.5, "category_name": "Groceries", "confidence": 0.92},
                {"name": "Bread Loaf", "amount": 4.0, "category_name": "Groceries", "confidence": 0.9},
                {"name": "GST", "amount": 0.59, "category_name": "Other", "confidence": 0.8},
                {"name": "EFTPOS Purchase", "amount": 9.5, "category_name": "Other", "confidence": 0.8},
            ],
        }
    )

    assert [item.name for item in result.items] == ["Milk 2L", "Bread Loaf"]
    assert result.total == 6.5


def test_ocr_payload_keeps_discounts_and_total_when_consistent() -> None:
    result = ocr_result_from_payload(
        {
            "merchant": "Woolworths",
            "total": 8.0,
            "ocr_text": "Woolworths\nApples 5.00\nCereal 6.00\nPromo Discount -3.00\nTotal 8.00",
            "items": [
                {"name": "Apples", "amount": 5, "category_name": "Groceries", "confidence": 0.95},
                {"name": "Cereal", "amount": 6, "category_name": "Groceries", "confidence": 0.95},
                {
                    "name": "Promo Discount",
                    "amount": -3,
                    "category_name": "Groceries",
                    "confidence": 0.75,
                },
            ],
        }
    )

    assert result.total == 8
    assert [(item.name, item.amount) for item in result.items] == [
        ("Apples", 5),
        ("Cereal", 6),
        ("Promo Discount", -3),
    ]
