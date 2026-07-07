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
