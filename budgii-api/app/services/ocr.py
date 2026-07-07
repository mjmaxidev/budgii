from dataclasses import dataclass
from typing import Protocol


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


def get_receipt_ocr_provider(provider_name: str) -> ReceiptOcrProvider:
    if provider_name == "deterministic":
        return DeterministicReceiptOcrProvider()
    raise ValueError(f"Unsupported receipt OCR provider: {provider_name}")
