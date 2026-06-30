import type { ReceiptItem } from '@/types'
import { uid } from './id'

/**
 * Deterministic mock OCR/AI extraction. In a real build this is where an OCR +
 * categorization service would plug in. For the MVP we return a fixed, realistic
 * Whole Foods receipt and assign categories/tags/members with simple keyword rules.
 */

type RawLine = { name: string; amount: number }

const MOCK_RECEIPT_LINES: RawLine[] = [
  { name: 'Milk 1%', amount: 3.49 },
  { name: 'Organic Bananas', amount: 2.38 },
  { name: 'Greek Yogurt', amount: 1.99 },
  { name: 'Whole Grain Bread', amount: 3.79 },
  { name: 'Coffee Beans', amount: 8.99 },
  { name: 'Uber Trip', amount: 18.9 },
]

export const MOCK_RECEIPT_MERCHANT = 'Whole Foods Market'
export const MOCK_RECEIPT_TOTAL = 39.54
export const MOCK_RECEIPT_OCR = `WHOLE FOODS MARKET
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
Thank you for shopping!`

/** Keyword -> category name mapping (category ids resolved by caller). */
function categoryForItem(name: string): { categoryName: string; confidence: number } {
  const n = name.toLowerCase()
  if (/(uber|trip|taxi|lyft|fuel|gas)/.test(n)) return { categoryName: 'Transport', confidence: 0.99 }
  if (/(coffee|latte|espresso|beans|dining|restaurant)/.test(n)) return { categoryName: 'Dining', confidence: 0.9 }
  return { categoryName: 'Groceries', confidence: 0.9 + Math.min(0.09, n.length / 200) }
}

export type MockExtractInput = {
  receiptId: string
  resolveCategoryId: (categoryName: string) => string
  defaultMemberId?: string
  defaultTagIds?: string[]
}

export function mockExtractReceiptItems(input: MockExtractInput): ReceiptItem[] {
  const { receiptId, resolveCategoryId, defaultMemberId, defaultTagIds = [] } = input
  return MOCK_RECEIPT_LINES.map((line) => {
    const { categoryName, confidence } = categoryForItem(line.name)
    return {
      id: uid('ritem'),
      receiptId,
      name: line.name,
      amount: line.amount,
      categoryId: resolveCategoryId(categoryName),
      tagIds: defaultTagIds,
      memberId: defaultMemberId,
      aiConfidence: Math.round(confidence * 100) / 100,
    }
  })
}
