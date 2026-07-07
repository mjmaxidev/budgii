import {
  analyzeReceipt,
  apiReceiptItemToReceiptItem,
  apiReceiptToReceipt,
  getReceipt,
  getReceiptStatus,
  listReceiptItems,
} from '@/api/receipts'
import { useStore } from '@/store/appStore'
import type { ReceiptItemResponse, ReceiptResponse } from '@/api/types'

export function isReceiptAnalysisComplete(status: string): boolean {
  return status === 'needs_review' || status === 'processed' || status === 'failed'
}

function buildAnalyzeInput() {
  const { categories, familyMembers } = useStore.getState()
  return {
    categoryIds: Object.fromEntries(categories.map((category) => [category.name, category.id])),
    defaultCategoryId: categories[0]?.id,
    defaultMemberId: familyMembers.find((member) => member.isDefault)?.id,
  }
}

export function hydrateReceiptAnalysis(
  receiptId: string,
  receiptResponse: ReceiptResponse,
  itemResponses: ReceiptItemResponse[],
): void {
  const receipt = apiReceiptToReceipt(receiptResponse)
  const savedItems = itemResponses.map(apiReceiptItemToReceiptItem)
  useStore.setState((state) => ({
    receipts: state.receipts.map((item) =>
      item.id === receiptId ? { ...receipt, itemIds: savedItems.map((savedItem) => savedItem.id) } : item,
    ),
    receiptItems: [...savedItems, ...state.receiptItems.filter((item) => item.receiptId !== receiptId)],
  }))
}

export async function runReceiptAnalysis(
  householdId: string,
  receiptId: string,
  options: { maxAttempts?: number } = {},
): Promise<void> {
  const analysis = await analyzeReceipt(householdId, receiptId, buildAnalyzeInput())
  const queuedReceipt = apiReceiptToReceipt(analysis.receipt)
  useStore.setState((state) => ({
    receipts: state.receipts.map((receipt) =>
      receipt.id === receiptId
        ? { ...receipt, status: queuedReceipt.status, analysisError: queuedReceipt.analysisError }
        : receipt,
    ),
  }))

  if (isReceiptAnalysisComplete(analysis.receipt.status)) {
    hydrateReceiptAnalysis(receiptId, analysis.receipt, analysis.items)
    return
  }

  await waitForReceiptAnalysis(householdId, receiptId, options.maxAttempts ?? 18)
}

async function waitForReceiptAnalysis(householdId: string, receiptId: string, maxAttempts: number): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    const status = await getReceiptStatus(householdId, receiptId)

    if (status.status === 'failed') {
      useStore.setState((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt.id === receiptId
            ? { ...receipt, status: 'failed', analysisError: status.analysis_error ?? undefined }
            : receipt,
        ),
      }))
      throw new Error(status.analysis_error || 'Receipt analysis failed')
    }

    if (isReceiptAnalysisComplete(status.status)) {
      const [receipt, items] = await Promise.all([
        getReceipt(householdId, receiptId),
        listReceiptItems(householdId, receiptId),
      ])
      hydrateReceiptAnalysis(receiptId, receipt, items.items)
      return
    }
  }

  throw new Error('Receipt analysis is taking longer than expected')
}
