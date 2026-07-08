import json

import pytest

from app.services.ocr import (
    OpenAiReceiptOcrProvider,
    get_receipt_ocr_provider,
    ocr_result_from_payload,
    parse_response_json,
)


def test_parse_response_json_extracts_output_text_content() -> None:
    payload = {
        "merchant": "Corner Store",
        "total": 12.5,
        "ocr_text": "Corner Store\nTotal 12.50",
        "items": [
            {
                "name": "Milk",
                "amount": 4.25,
                "category_name": "Groceries",
                "confidence": 0.91,
            }
        ],
    }

    parsed = parse_response_json(
        {
            "output": [
                {
                    "type": "message",
                    "content": [
                        {
                            "type": "output_text",
                            "text": json.dumps(payload),
                        }
                    ],
                }
            ]
        }
    )

    assert parsed == payload


def test_ocr_result_from_payload_clamps_confidence_and_defaults() -> None:
    result = ocr_result_from_payload(
        {
            "merchant": "",
            "total": -4,
            "ocr_text": "raw text",
            "items": [
                {
                    "name": "Train fare",
                    "amount": 6.5,
                    "category_name": "",
                    "confidence": 2,
                }
            ],
        }
    )

    assert result.merchant == "Unknown Merchant"
    assert result.total == 6.5
    assert result.items[0].category_name == "Other"
    assert result.items[0].confidence == 1


def test_openai_provider_requires_key_and_model() -> None:
    with pytest.raises(ValueError, match="OPENAI_API_KEY"):
        get_receipt_ocr_provider("openai", openai_api_key="", openai_model="gpt-5.5")

    with pytest.raises(ValueError, match="RECEIPT_OPENAI_MODEL"):
        get_receipt_ocr_provider("openai", openai_api_key="sk-test", openai_model="")

    provider = get_receipt_ocr_provider("openai", openai_api_key="sk-test", openai_model="gpt-5.5")
    assert isinstance(provider, OpenAiReceiptOcrProvider)
