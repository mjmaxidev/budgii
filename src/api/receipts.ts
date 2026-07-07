import { apiBlob, apiRequest, apiUpload } from '@/api/client'
import type {
  ReceiptAnalyzeResponse,
  ReceiptItemListResponse,
  ReceiptItemResponse,
  ReceiptListResponse,
  ReceiptResponse,
  ReceiptStatusResponse,
  ReceiptUploadResponse,
} from '@/api/types'
import type { Receipt, ReceiptItem } from '@/types'

type ReceiptInput = {
  id?: string
  uploadId?: string
  merchant: string
  date: string
  total: number
  imageUrl?: string
  ocrText?: string
  status?: Receipt['status']
}

type ReceiptPatch = Partial<ReceiptInput>

type ReceiptItemInput = {
  id?: string
  name: string
  amount: number
  categoryId: string
  tagIds?: string[]
  memberId?: string
  aiConfidence?: number
  manuallyEdited?: boolean
}

type ReceiptItemPatch = Partial<ReceiptItemInput>

type AnalyzeReceiptInput = {
  categoryIds: Record<string, string>
  defaultCategoryId?: string
  defaultMemberId?: string
  defaultTagIds?: string[]
}

function receiptBody(input: ReceiptInput | ReceiptPatch): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if ('id' in input) body.id = input.id
  if ('uploadId' in input) body.upload_id = input.uploadId ?? null
  if ('merchant' in input) body.merchant = input.merchant
  if ('date' in input) body.date = input.date
  if ('total' in input) body.total = input.total
  if ('imageUrl' in input) body.image_url = input.imageUrl ?? null
  if ('ocrText' in input) body.ocr_text = input.ocrText ?? null
  if ('status' in input) body.status = input.status
  return body
}

function receiptItemBody(input: ReceiptItemInput | ReceiptItemPatch): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if ('id' in input) body.id = input.id
  if ('name' in input) body.name = input.name
  if ('amount' in input) body.amount = input.amount
  if ('categoryId' in input) body.category_id = input.categoryId
  if ('tagIds' in input) body.tag_ids = input.tagIds
  if ('memberId' in input) body.persona_id = input.memberId ?? null
  if ('aiConfidence' in input) body.ai_confidence = input.aiConfidence
  if ('manuallyEdited' in input) body.manually_edited = input.manuallyEdited
  return body
}

export function apiReceiptToReceipt(receipt: ReceiptResponse): Receipt {
  return {
    id: receipt.id,
    uploadId: receipt.upload_id ?? undefined,
    merchant: receipt.merchant,
    date: receipt.date,
    total: receipt.total,
    imageUrl: receipt.image_url ?? undefined,
    ocrText: receipt.ocr_text ?? undefined,
    itemIds: receipt.item_ids,
    status: isReceiptStatus(receipt.status) ? receipt.status : 'uploaded',
  }
}

export function apiReceiptItemToReceiptItem(item: ReceiptItemResponse): ReceiptItem {
  return {
    id: item.id,
    receiptId: item.receipt_id,
    name: item.name,
    amount: item.amount,
    categoryId: item.category_id,
    tagIds: item.tag_ids,
    memberId: item.persona_id ?? undefined,
    aiConfidence: item.ai_confidence,
    manuallyEdited: item.manually_edited,
  }
}

export function apiReceiptsToReceipts(receipts: ReceiptResponse[]): Receipt[] {
  return receipts.map(apiReceiptToReceipt)
}

export function apiReceiptItemsToReceiptItems(items: ReceiptItemResponse[]): ReceiptItem[] {
  return items.map(apiReceiptItemToReceiptItem)
}

function isReceiptStatus(status: string): status is Receipt['status'] {
  return ['uploaded', 'analyzing', 'needs_review', 'processed', 'failed'].includes(status)
}

export async function uploadReceipt(householdId: string, file: File): Promise<ReceiptUploadResponse> {
  const form = new FormData()
  form.set('household_id', householdId)
  form.set('file', file)
  return apiUpload<ReceiptUploadResponse>('/receipts/upload', form)
}

export async function analyzeReceipt(
  householdId: string,
  receiptId: string,
  input: AnalyzeReceiptInput,
): Promise<ReceiptAnalyzeResponse> {
  return apiRequest<ReceiptAnalyzeResponse>(`/receipts/${receiptId}/analyze`, {
    method: 'POST',
    body: {
      household_id: householdId,
      category_ids: input.categoryIds,
      default_category_id: input.defaultCategoryId ?? null,
      default_persona_id: input.defaultMemberId ?? null,
      default_tag_ids: input.defaultTagIds ?? [],
    },
  })
}

export async function getReceiptStatus(householdId: string, receiptId: string): Promise<ReceiptStatusResponse> {
  return apiRequest<ReceiptStatusResponse>(
    `/receipts/${receiptId}/status?household_id=${encodeURIComponent(householdId)}`,
  )
}

export async function getReceiptFile(householdId: string, receiptId: string): Promise<Blob> {
  return apiBlob(`/receipts/${receiptId}/file?household_id=${encodeURIComponent(householdId)}`)
}

export async function listReceipts(
  householdId: string,
  options: { since?: string; limit?: number; offset?: number } = {},
): Promise<ReceiptListResponse> {
  const params = new URLSearchParams()
  if (options.since) params.set('since', options.since)
  if (options.limit) params.set('limit', String(options.limit))
  if (options.offset) params.set('offset', String(options.offset))
  const query = params.toString()
  return apiRequest<ReceiptListResponse>(`/households/${householdId}/receipts${query ? `?${query}` : ''}`)
}

export async function listAllReceipts(householdId: string): Promise<ReceiptResponse[]> {
  const receipts: ReceiptResponse[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const page = await listReceipts(householdId, { limit, offset })
    receipts.push(...page.receipts)
    offset += page.receipts.length
    if (receipts.length >= page.total || page.receipts.length === 0) break
  }

  return receipts
}

export async function createReceipt(householdId: string, input: ReceiptInput): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>(`/households/${householdId}/receipts`, {
    method: 'POST',
    body: receiptBody(input),
  })
}

export async function getReceipt(householdId: string, receiptId: string): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>(`/households/${householdId}/receipts/${receiptId}`)
}

export async function updateReceipt(
  householdId: string,
  receiptId: string,
  patch: ReceiptPatch,
): Promise<ReceiptResponse> {
  return apiRequest<ReceiptResponse>(`/households/${householdId}/receipts/${receiptId}`, {
    method: 'PATCH',
    body: receiptBody(patch),
  })
}

export async function deleteReceipt(householdId: string, receiptId: string): Promise<void> {
  await apiRequest<void>(`/households/${householdId}/receipts/${receiptId}`, {
    method: 'DELETE',
  })
}

export async function listReceiptItems(householdId: string, receiptId: string): Promise<ReceiptItemListResponse> {
  return apiRequest<ReceiptItemListResponse>(`/households/${householdId}/receipts/${receiptId}/items`)
}

export async function createReceiptItem(
  householdId: string,
  receiptId: string,
  input: ReceiptItemInput,
): Promise<ReceiptItemResponse> {
  return apiRequest<ReceiptItemResponse>(`/households/${householdId}/receipts/${receiptId}/items`, {
    method: 'POST',
    body: receiptItemBody(input),
  })
}

export async function updateReceiptItem(
  householdId: string,
  receiptId: string,
  itemId: string,
  patch: ReceiptItemPatch,
): Promise<ReceiptItemResponse> {
  return apiRequest<ReceiptItemResponse>(`/households/${householdId}/receipts/${receiptId}/items/${itemId}`, {
    method: 'PATCH',
    body: receiptItemBody(patch),
  })
}

export async function deleteReceiptItem(householdId: string, receiptId: string, itemId: string): Promise<void> {
  await apiRequest<void>(`/households/${householdId}/receipts/${receiptId}/items/${itemId}`, {
    method: 'DELETE',
  })
}
