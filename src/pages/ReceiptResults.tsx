import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MoreVertical, Plus, Sparkles } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { MoneyText } from '@/components/ui/MoneyText'
import { ReceiptItemRow } from '@/components/receipts/ReceiptItemRow'
import { ReceiptItemEditor } from '@/components/receipts/ReceiptItemEditor'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { useStore } from '@/store/appStore'
import { formatDateTime } from '@/utils/dates'

export function ReceiptResults() {
  const { receiptId = '' } = useParams()
  const navigate = useNavigate()
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
  const addReceiptItem = useStore((s) => s.addReceiptItem)
  const [editingId, setEditingId] = useState<string | null>(null)

  if (!receipt) {
    return (
      <AppShell topBar={<TopBar title="Receipt Results" showBack />}>
        <p className="mt-10 text-center text-muted">Receipt not found.</p>
      </AppShell>
    )
  }

  const allHighConfidence = items.every((i) => i.aiConfidence >= 0.9)

  function confirm() {
    if (!receipt) return
    confirmReceiptItems(receiptId)
    const firstItemCategory = items[0]?.categoryId || ''
    navigate('/transaction-confirm', {
      state: {
        transaction: {
          merchant: receipt.merchant,
          amount: receipt.total,
          categoryId: firstItemCategory,
          date: receipt.date,
        },
      },
    })
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Receipt Results"
          showBack
          right={
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-line/40">
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

      <p className="mt-4 text-[15px] font-bold text-ink">{items.length} items found</p>

      <Card className="mt-2 px-4 py-0">
        {items.map((item) => (
          <ReceiptItemRow key={item.id} item={item} onEdit={() => setEditingId(item.id)} />
        ))}
      </Card>

      <div className="mt-5 space-y-3">
        <ActionButton variant="green" onClick={confirm}>
          Confirm All Items
        </ActionButton>
        <ActionButton
          variant="greenOutline"
          onClick={() => {
            addReceiptItem(receiptId, { name: 'New Item', amount: 0 })
          }}
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
              {allHighConfidence ? 'All items were recognized with high accuracy.' : 'Review the highlighted items before confirming.'}
            </p>
          </div>
        </div>
      </div>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Item">
        {editingId && <ReceiptItemEditor itemId={editingId} onDone={() => setEditingId(null)} />}
      </Modal>
    </AppShell>
  )
}
