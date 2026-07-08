import base64
import json
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import httpx


@dataclass(frozen=True)
class OcrReceiptLine:
    name: str
    amount: float
    category_name: str
    confidence: float


@dataclass(frozen=True)
class OcrReceiptResult:
    merchant: str
    total: float
    ocr_text: str
    items: list[OcrReceiptLine]


class ReceiptOcrProvider(Protocol):
    async def analyze(self, storage_path: str | None) -> OcrReceiptResult:
        pass


MOCK_RECEIPT_OCR = """WHOLE FOODS MARKET
365 5th Ave, New York, NY 10016
(212) 555-0195
--------------------------------
Milk 1%               $3.49
Organic Bananas       $2.38
Greek Yogurt          $1.99
Whole Grain Bread     $3.79
Coffee Beans          $8.99
Uber Trip            $18.90
--------------------------------
Total                $39.54
Thank you for shopping!"""

MOCK_RECEIPT_LINES = [
    ("Milk 1%", 3.49),
    ("Organic Bananas", 2.38),
    ("Greek Yogurt", 1.99),
    ("Whole Grain Bread", 3.79),
    ("Coffee Beans", 8.99),
    ("Uber Trip", 18.90),
]


def category_name_for_item(name: str) -> tuple[str, float]:
    normalized = name.lower()
    if any(term in normalized for term in ("uber", "trip", "taxi", "lyft", "fuel", "gas")):
        return "Transport", 0.99
    if any(term in normalized for term in ("coffee", "latte", "espresso", "beans", "dining", "restaurant")):
        return "Dining", 0.90
    return "Groceries", min(0.99, 0.90 + min(0.09, len(normalized) / 200))


class DeterministicReceiptOcrProvider:
    async def analyze(self, storage_path: str | None) -> OcrReceiptResult:
        items: list[OcrReceiptLine] = []
        for name, amount in MOCK_RECEIPT_LINES:
            category_name, confidence = category_name_for_item(name)
            items.append(
                OcrReceiptLine(
                    name=name,
                    amount=amount,
                    category_name=category_name,
                    confidence=confidence,
                )
            )

        return OcrReceiptResult(
            merchant="Whole Foods Market",
            total=39.54,
            ocr_text=MOCK_RECEIPT_OCR,
            items=items,
        )


RECEIPT_ANALYSIS_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["merchant", "total", "ocr_text", "items"],
    "properties": {
        "merchant": {"type": "string"},
        "total": {"type": "number"},
        "ocr_text": {"type": "string"},
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["name", "amount", "category_name", "confidence"],
                "properties": {
                    "name": {"type": "string"},
                    "amount": {"type": "number"},
                    "category_name": {"type": "string"},
                    "confidence": {"type": "number"},
                },
            },
        },
    },
}


class OpenAiReceiptOcrProvider:
    def __init__(self, api_key: str, model: str) -> None:
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required when RECEIPT_OCR_PROVIDER=openai")
        if not model:
            raise ValueError("RECEIPT_OPENAI_MODEL is required when RECEIPT_OCR_PROVIDER=openai")
        self.api_key = api_key
        self.model = model

    async def analyze(self, storage_path: str | None) -> OcrReceiptResult:
        if not storage_path:
            raise ValueError("A receipt image upload is required for OpenAI receipt analysis")

        image_url = image_file_to_data_url(storage_path)
        response = await self.create_response(image_url)
        payload = parse_response_json(response)
        return ocr_result_from_payload(payload)

    async def create_response(self, image_url: str) -> dict:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/responses",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "input": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "input_text",
                                    "text": (
                                        "Extract this receipt into strict JSON. "
                                        "Return merchant, total, raw OCR text, and line items. "
                                        "For each item choose the closest broad category name such as "
                                        "Groceries, Dining, Transport, Shopping, Bills, Health, "
                                        "Entertainment, Travel, or Other. Use numeric confidence from 0 to 1."
                                    ),
                                },
                                {
                                    "type": "input_image",
                                    "image_url": image_url,
                                },
                            ],
                        }
                    ],
                    "text": {
                        "format": {
                            "type": "json_schema",
                            "name": "receipt_analysis",
                            "strict": True,
                            "schema": RECEIPT_ANALYSIS_SCHEMA,
                        }
                    },
                },
            )
            response.raise_for_status()
            return response.json()


def image_file_to_data_url(storage_path: str) -> str:
    path = Path(storage_path)
    if not path.is_file():
        raise ValueError("Receipt image file not found")

    mime_type = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def parse_response_json(response: dict) -> dict:
    output_text = response.get("output_text")
    if not isinstance(output_text, str):
        output_text = extract_output_text(response)
    if not output_text:
        raise ValueError("OpenAI receipt analysis returned no text")

    parsed = json.loads(output_text)
    if not isinstance(parsed, dict):
        raise ValueError("OpenAI receipt analysis did not return an object")
    return parsed


def extract_output_text(response: dict) -> str:
    chunks: list[str] = []
    output = response.get("output", [])
    if not isinstance(output, list):
        return ""

    for item in output:
        if not isinstance(item, dict):
            continue
        content = item.get("content", [])
        if not isinstance(content, list):
            continue
        for part in content:
            if (
                isinstance(part, dict)
                and part.get("type") == "output_text"
                and isinstance(part.get("text"), str)
            ):
                chunks.append(part["text"])

    return "".join(chunks)


def ocr_result_from_payload(payload: dict) -> OcrReceiptResult:
    items_payload = payload.get("items")
    if not isinstance(items_payload, list):
        raise ValueError("OpenAI receipt analysis returned invalid items")

    items_by_name: dict[str, OcrReceiptLine] = {}
    for item in items_payload:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        if not name or is_non_item_receipt_line(name):
            continue
        amount = max(0, parse_number(item.get("amount")))
        if amount <= 0:
            continue
        category_name = str(item.get("category_name") or "Other").strip() or "Other"
        confidence = max(0, min(1, parse_number(item.get("confidence"))))
        key = name.lower()
        existing = items_by_name.get(key)
        if existing:
            items_by_name[key] = OcrReceiptLine(
                name=existing.name,
                amount=round(existing.amount + amount, 2),
                category_name=existing.category_name,
                confidence=max(existing.confidence, confidence),
            )
            continue
        items_by_name[key] = OcrReceiptLine(
            name=name,
            amount=amount,
            category_name=category_name,
            confidence=confidence,
        )

    items = list(items_by_name.values())
    if not items:
        raise ValueError("OpenAI receipt analysis returned no line items")

    total = parse_number(payload.get("total"))
    if total <= 0:
        total = round(sum(item.amount for item in items), 2)

    return OcrReceiptResult(
        merchant=str(payload.get("merchant") or "").strip() or "Unknown Merchant",
        total=max(0, total),
        ocr_text=str(payload.get("ocr_text") or "").strip(),
        items=items,
    )


def parse_number(value: object) -> float:
    if isinstance(value, str):
        value = value.replace("$", "").replace(",", "").strip()
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def is_non_item_receipt_line(name: str) -> bool:
    normalized = " ".join(name.lower().replace(":", " ").split())
    return normalized in {
        "subtotal",
        "sub total",
        "tax",
        "gst",
        "sales tax",
        "total",
        "amount due",
        "balance due",
        "payment",
        "cash",
        "card",
        "credit card",
        "visa",
        "mastercard",
        "eftpos",
        "change",
        "change due",
    }


def get_receipt_ocr_provider(
    provider_name: str,
    *,
    openai_api_key: str = "",
    openai_model: str = "",
) -> ReceiptOcrProvider:
    if provider_name == "deterministic":
        return DeterministicReceiptOcrProvider()
    if provider_name == "openai":
        return OpenAiReceiptOcrProvider(openai_api_key, openai_model)
    raise ValueError(f"Unsupported receipt OCR provider: {provider_name}")
