import argparse
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.services.ocr import get_receipt_ocr_provider


async def analyze_fixture(path: Path, *, summary: bool) -> dict:
    settings = get_settings()
    provider = get_receipt_ocr_provider(
        "openai",
        openai_api_key=settings.openai_api_key,
        openai_model=settings.receipt_openai_model,
    )
    result = await provider.analyze(str(path))
    item_total = round(sum(item.amount for item in result.items), 2)
    payload = {
        "file": str(path),
        "merchant": result.merchant,
        "total": result.total,
        "item_total": item_total,
        "item_count": len(result.items),
        "items": [
            {
                "name": item.name,
                "amount": item.amount,
                "category": item.category_name,
                "confidence": item.confidence,
            }
            for item in result.items
        ],
    }
    if summary:
        payload["sample_items"] = [item.name for item in result.items[:5]]
        del payload["items"]
    return payload


async def main() -> None:
    parser = argparse.ArgumentParser(description="Run OpenAI receipt OCR against local image fixtures.")
    parser.add_argument(
        "--summary", action="store_true", help="Print compact summaries instead of all items."
    )
    parser.add_argument("images", nargs="+", type=Path)
    args = parser.parse_args()

    summaries = []
    for image_path in args.images:
        if not image_path.is_file():
            raise SystemExit(f"Fixture not found: {image_path}")
        summaries.append(await analyze_fixture(image_path, summary=args.summary))

    print(json.dumps(summaries, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
