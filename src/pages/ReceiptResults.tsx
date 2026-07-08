import { useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Image, MoreVertical, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { ReceiptItemRow } from '@/components/receipts/ReceiptItemRow'
import { ReceiptItemCreateForm } from '@/components/receipts/ReceiptItemCreateForm'
import { ReceiptItemEditor } from '@/components/receipts/ReceiptItemEditor'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { apiExpenseToExpense, createExpense } from '@/api/expenses'
import { deleteReceipt as apiDeleteReceipt, updateReceipt as apiUpdateReceipt } from '@/api/receipts'
import { runReceiptAnalysis } from '@/api/receiptAnalysis'
import { useAuthStore } from '@/store/authStore'
import { withFrom } from '@/utils/navigation'
import { useStore } from '@/store/appStore'
import { formatDateTime } from '@/utils/dates'

export function ReceiptResults() {
  const { receiptId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const receipt = useStore((s) => s.receipts.find((r) => r.id === receiptId))
  // Select the base array (stable reference) and derive the filtered list in render.
  // Returning `.filter(...)` straight from the selector creates a new array every
  // render, which makes zustand's useSyncExternalStore snapshot change endlessly
  // (React error #185 — "maximum update depth exceeded").
  const allReceiptItems = useStore((s) => s.receiptItems)
  const items = useMemo(
    () => allReceiptItems.filter((i) => i.receiptId === receiptId),
    [allReceiptItems, receiptId],
  )
  const confirmReceiptItems = useStore((s) => s.confirmReceiptItems)
  const deleteReceipt = useStore((s) => s.deleteReceipt)
  const analyzeLocalReceipt = useStore((s) => s.analyzeReceipt)
  const householdId = useAuthStore((s) => s.householdId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [matchHelpOpen, setMatchHelpOpen] = useState(false)
  const [matchHelpConfidence, setMatchHelpConfidence] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [error, setError] = useState('')

  if (!receipt) {
    return (
      <AppShell topBar={<TopBar title="Receipt Results" showBack />}>
        <p className="mt-10 text-center text-muted">Receipt not found.</p>
      </AppShell>
    )
  }

  const allHighConfidence = items.every((i) => i.aiConfidence >= 0.9)

  async function confirm() {
    if (!receipt) return
    if (isApiEnabled()) {
      if (!householdId) {
        setError('Sign in again to confirm this receipt.')
        return
      }

      setSaving(true)
      setError('')
      try {
        const existing = new Set(
          useStore
            .getState()
            .expenses.filter((expense) => expense.receiptId === receiptId && expense.source === 'receipt_ai')
            .map(
              (expense) =>
                `${expense.merchant}:${expense.amount}:${expense.categoryId}:${expense.memberId ?? ''}`,
            ),
        )
        const savedExpenses = await Promise.all(
          items
            .filter(
              (item) =>
                !existing.has(`${item.name}:${item.amount}:${item.categoryId}:${item.memberId ?? ''}`),
            )
            .map(async (item) => {
              const expense = apiExpenseToExpense(
                await createExpense(householdId, {
                  amount: item.amount,
                  date: receipt.date,
                  merchant: item.name,
                  categoryId: item.categoryId,
                  tagIds: item.tagIds,
                  memberId: item.memberId,
                  notes: `From ${receipt.merchant}`,
                  receiptId,
                  source: 'receipt_ai',
                }),
              )
              return expense
            }),
        )
        await apiUpdateReceipt(householdId, receiptId, { status: 'processed' })
        useStore.setState((state) => ({
          expenses: [...savedExpenses, ...state.expenses],
          receipts: state.receipts.map((r) => (r.id === receiptId ? { ...r, status: 'processed' } : r)),
        }))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not confirm receipt')
        setSaving(false)
        return
      }
    } else {
      confirmReceiptItems(receiptId)
    }
    const firstItemCategory = items[0]?.categoryId || ''
    const firstItemName = items[0]?.name || receipt.merchant
    navigate('/transaction-confirm', {
      state: {
        transaction: {
          merchant: firstItemName,
          amount: receipt.total,
          categoryId: firstItemCategory,
          date: receipt.date,
        },
      },
    })
  }

  async function removeReceipt() {
    if (!isApiEnabled()) {
      deleteReceipt(receiptId)
      navigate('/home')
      return
    }

    if (!householdId) {
      setError('Sign in again to delete this receipt.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await apiDeleteReceipt(householdId, receiptId)
      deleteReceipt(receiptId)
      navigate('/home')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete receipt')
      setSaving(false)
    }
  }

  async function reanalyzeReceipt() {
    setMenuOpen(false)
    setError('')

    if (!isApiEnabled()) {
      analyzeLocalReceipt(receiptId)
      return
    }

    if (!householdId) {
      setError('Sign in again to re-analyze this receipt.')
      return
    }

    setReanalyzing(true)
    try {
      await runReceiptAnalysis(householdId, receiptId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not re-analyze receipt')
    } finally {
      setReanalyzing(false)
    }
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Receipt Results"
          showBack
          right={
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Receipt options"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-line/40"
            >
              <MoreVertical size={20} />
            </button>
          }
        />
      }
    >
      <div className="flex items-start justify-between border-b border-line/70 pb-4">
        <div>
          <h2 className="text-[20px] font-extrabold text-ink">{receipt.merchant}</h2>
          <p className="text-[13px] text-muted">{formatDateTime(receipt.date)}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-muted">Total</p>
          <MoneyText amount={receipt.total} className="text-[22px] font-extrabold text-green" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[15px] font-bold text-ink">{items.length} items found</p>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green" />
            90%+ match
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Review
          </span>
        </div>
      </div>

      <Card className="mt-3 px-3 py-0">
        {items.map((item) => (
          <ReceiptItemRow
            key={item.id}
            item={item}
            onEdit={() => setEditingId(item.id)}
            onMatchClick={(confidence) => {
              setMatchHelpConfidence(confidence)
              setMatchHelpOpen(true)
            }}
          />
        ))}
      </Card>

      <div className="mt-5 space-y-3">
        {error && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
        )}
        {receipt.status === 'failed' && receipt.analysisError && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
            {receipt.analysisError}
          </p>
        )}
        <ActionButton
          variant="green"
          onClick={() => void confirm()}
          disabled={saving || reanalyzing || receipt.status === 'analyzing' || items.length === 0}
        >
          {saving ? 'Saving…' : 'Confirm All Items'}
        </ActionButton>
        <ActionButton
          variant="outline"
          onClick={() => void reanalyzeReceipt()}
          disabled={reanalyzing || saving}
          leftIcon={<RefreshCw size={18} className={reanalyzing ? 'animate-spin' : undefined} />}
        >
          {reanalyzing ? 'Re-analyzing…' : 'Re-analyze Receipt'}
        </ActionButton>
        <ActionButton
          variant="greenOutline"
          onClick={() => setAddItemOpen(true)}
          leftIcon={<Plus size={18} />}
        >
          Add Missing Item
        </ActionButton>
      </div>

      <div className="mt-5 rounded-card bg-greenSoft p-4">
        <div className="flex items-center gap-3">
          <Sparkles size={24} className="text-green" />
          <div>
            <p className="text-[16px] font-bold text-ink">Looks good!</p>
            <p className="text-[14px] text-muted">
              {allHighConfidence
                ? 'All categories were matched with high confidence.'
                : 'Some items have lower category match scores — review them before confirming.'}
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={matchHelpOpen}
        onClose={() => setMatchHelpOpen(false)}
        title="Category match"
        variant="center"
      >
        <p className="text-[15px] leading-snug text-muted">
          The <span className="font-bold text-ink">{matchHelpConfidence}%</span> shows how confident the AI is
          about this item&apos;s category.
        </p>
        <p className="mt-3 text-[15px] leading-snug text-muted">
          {matchHelpConfidence !== null && matchHelpConfidence >= 90
            ? 'Green scores usually look right.'
            : 'Orange scores are worth a quick check.'}{' '}
          Tap the pencil on the item to change the category if it looks wrong.
        </p>
        <ActionButton className="mt-5" variant="green" onClick={() => setMatchHelpOpen(false)}>
          Got it
        </ActionButton>
      </Modal>

      <Modal open={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add Missing Item">
        <ReceiptItemCreateForm receiptId={receiptId} onDone={() => setAddItemOpen(false)} />
      </Modal>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Item">
        {editingId && <ReceiptItemEditor itemId={editingId} onDone={() => setEditingId(null)} />}
      </Modal>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="Receipt Options" variant="center">
        <div className="space-y-2">
          <button
            onClick={() => {
              setMenuOpen(false)
              navigate(`/receipt-viewer/${receiptId}`, withFrom(location.pathname))
            }}
            className="flex w-full items-center gap-3 rounded-input border border-line bg-surface p-3 text-left text-[15px] font-bold text-ink active:bg-line/40"
          >
            <Image size={18} className="text-green" /> View receipt image
          </button>
          <button
            onClick={() => void reanalyzeReceipt()}
            disabled={reanalyzing}
            className="flex w-full items-center gap-3 rounded-input border border-line bg-surface p-3 text-left text-[15px] font-bold text-ink active:bg-line/40 disabled:opacity-60"
          >
            <RefreshCw size={18} className={reanalyzing ? 'animate-spin text-green' : 'text-green'} />{' '}
            Re-analyze receipt
          </button>
          <button
            onClick={() => {
              setMenuOpen(false)
              setConfirmDelete(true)
            }}
            className="flex w-full items-center gap-3 rounded-input border border-red/40 bg-surface p-3 text-left text-[15px] font-bold text-red active:bg-redSoft"
          >
            <Trash2 size={18} /> Delete receipt
          </button>
        </div>
      </Modal>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete receipt?"
        variant="center"
      >
        <p className="text-[15px] text-muted">
          This will remove the receipt and all {items.length} scanned item{items.length === 1 ? '' : 's'}.
        </p>
        <div className="mt-5 flex gap-3">
          <ActionButton variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </ActionButton>
          <ActionButton variant="danger" onClick={() => void removeReceipt()} disabled={saving}>
            {saving ? 'Deleting…' : 'Delete'}
          </ActionButton>
        </div>
      </Modal>
    </AppShell>
  )
}
