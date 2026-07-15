# Receipt OCR QA

Use this checklist when testing `RECEIPT_OCR_PROVIDER=openai` with real receipt photos.

## Test Set

Use at least five receipts:

- Supermarket receipt with 5+ line items.
- Receipt with discounts or coupons.
- Receipt with GST/tax, subtotal, EFTPOS/card, and total lines.
- Cafe/restaurant receipt with fewer items.
- Blurry or angled photo that is still readable by a person.

Do not commit real personal receipt images.

## Setup

```bash
RECEIPT_OCR_PROVIDER=openai docker compose up --build
```

Confirm `.env` contains `OPENAI_API_KEY` and `RECEIPT_OPENAI_MODEL`.

## Pass Criteria

For each upload, verify the receipt result screen:

- Merchant is the store name, not a line item.
- Item names are actual purchased products/services.
- Store name is not repeated as every item name.
- Subtotal, GST/tax, EFTPOS/card, cash, balance, change, rewards, and savings lines are not imported as items.
- Discounts/coupons are negative items only when they belong to the purchase list.
- Total is reasonable compared with the visible receipt and imported item sum.
- Failed analysis shows a clear reviewable error instead of silently creating bad transactions.

## Regression Notes

The parser rejects merchant-name line items and common payment/tax noise before creating receipt items. If a provider response contains only noise, analysis should fail with `no line items` rather than generating bad expenses.
