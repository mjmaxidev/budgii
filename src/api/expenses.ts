import { apiRequest } from '@/api/client'
import type { ApplyRecurringResponse, ExpenseListResponse, ExpenseResponse } from '@/api/types'
import type { Expense } from '@/types'

type ExpenseApiInput = {
  id?: string
  amount: number
  date: string
  merchant: string
  categoryId: string
  tagIds?: string[]
  memberId?: string
  notes?: string
  receiptId?: string
  source?: Expense['source']
}

type ExpenseApiPatch = Partial<ExpenseApiInput>

function expenseBody(input: ExpenseApiInput | ExpenseApiPatch): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if ('id' in input) body.id = input.id
  if ('amount' in input) body.amount = input.amount
  if ('date' in input) body.date = input.date
  if ('merchant' in input) body.merchant = input.merchant
  if ('categoryId' in input) body.category_id = input.categoryId
  if ('tagIds' in input) body.tag_ids = input.tagIds
  if ('memberId' in input) body.persona_id = input.memberId ?? null
  if ('notes' in input) body.notes = input.notes ?? null
  if ('receiptId' in input) body.receipt_id = input.receiptId ?? null
  if ('source' in input) body.source = input.source
  return body
}

export function apiExpenseToExpense(expense: ExpenseResponse): Expense {
  return {
    id: expense.id,
    amount: expense.amount,
    date: expense.date,
    merchant: expense.merchant,
    categoryId: expense.category_id,
    tagIds: expense.tag_ids,
    memberId: expense.persona_id ?? undefined,
    notes: expense.notes ?? undefined,
    receiptId: expense.receipt_id ?? expense.receipt_upload_id ?? undefined,
    source: expense.source === 'receipt_ai' || expense.source === 'recurring' ? expense.source : 'manual',
  }
}

export function apiExpensesToExpenses(expenses: ExpenseResponse[]): Expense[] {
  return expenses.map(apiExpenseToExpense)
}

export async function listExpenses(
  householdId: string,
  options: { since?: string; limit?: number; offset?: number } = {},
): Promise<ExpenseListResponse> {
  const params = new URLSearchParams()
  if (options.since) params.set('since', options.since)
  if (options.limit) params.set('limit', String(options.limit))
  if (options.offset) params.set('offset', String(options.offset))
  const query = params.toString()
  return apiRequest<ExpenseListResponse>(`/households/${householdId}/expenses${query ? `?${query}` : ''}`)
}

export async function listAllExpenses(householdId: string): Promise<ExpenseResponse[]> {
  const expenses: ExpenseResponse[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const page = await listExpenses(householdId, { limit, offset })
    expenses.push(...page.expenses)
    offset += page.expenses.length
    if (expenses.length >= page.total || page.expenses.length === 0) break
  }

  return expenses
}

export async function createExpense(householdId: string, input: ExpenseApiInput): Promise<ExpenseResponse> {
  return apiRequest<ExpenseResponse>(`/households/${householdId}/expenses`, {
    method: 'POST',
    body: expenseBody(input),
  })
}

export async function applyDueRecurringTransactions(
  householdId: string,
  date = new Date(),
): Promise<ApplyRecurringResponse> {
  return apiRequest<ApplyRecurringResponse>(`/households/${householdId}/recurring/apply`, {
    method: 'POST',
    body: { date: date.toISOString() },
  })
}

export async function updateExpense(
  householdId: string,
  expenseId: string,
  patch: ExpenseApiPatch,
): Promise<ExpenseResponse> {
  return apiRequest<ExpenseResponse>(`/households/${householdId}/expenses/${expenseId}`, {
    method: 'PATCH',
    body: expenseBody(patch),
  })
}

export async function deleteExpense(householdId: string, expenseId: string): Promise<void> {
  await apiRequest<void>(`/households/${householdId}/expenses/${expenseId}`, {
    method: 'DELETE',
  })
}
