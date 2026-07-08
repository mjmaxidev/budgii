import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppBack } from '@/hooks/useAppBack'
import { Trash2, Sparkles, FileText, Plus, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Chip } from '@/components/ui/Chip'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { Modal } from '@/components/ui/Modal'
import { ReceiptThumbnail } from '@/components/receipts/ReceiptThumbnail'
import { ActionButton } from '@/components/ui/ActionButton'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import {
  apiReceiptItemToReceiptItem,
  deleteReceiptItem,
  updateReceiptItem as apiUpdateReceiptItem,
} from '@/api/receipts'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import { useReceiptImageUrl } from '@/hooks/useReceiptImageUrl'
import { formatDateTime } from '@/utils/dates'

export function ItemDetail() {
  const { itemId = '' } = useParams()
  const goBack = useAppBack()
  const item = useStore((s) => s.receiptItems.find((i) => i.id === itemId))
  const receipt = useStore((s) => s.receipts.find((r) => r.id === item?.receiptId))
  const removeReceiptItem = useStore((s) => s.removeReceiptItem)
  const updateReceiptItem = useStore((s) => s.updateReceiptItem)
  const householdId = useAuthStore((s) => s.householdId)
  const { category, tag, tags } = useLookups()
  const [openReceipt, setOpenReceipt] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const receiptImageUrl = useReceiptImageUrl({
    receiptId: receipt?.id,
    uploadId: receipt?.uploadId,
    imageUrl: receipt?.imageUrl,
  })

  if (!item) {
    return (
      <AppShell topBar={<TopBar title="Item Detail" showBack />}>
        <p className="mt-10 text-center text-muted">Item not found.</p>
      </AppShell>
    )
  }

  const currentItem = item
  const cat = category(currentItem.categoryId)
  const confidence = Math.round(currentItem.aiConfidence * 100)

  async function updateTags(tagIds: string[]) {
    if (!isApiEnabled()) {
      updateReceiptItem(currentItem.id, { tagIds })
      return
    }

    if (!householdId) {
      setError('Sign in again to update this item.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const saved = apiReceiptItemToReceiptItem(
        await apiUpdateReceiptItem(householdId, currentItem.receiptId, currentItem.id, { tagIds }),
      )
      updateReceiptItem(currentItem.id, saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update item')
    } finally {
      setSaving(false)
    }
  }

  async function removeItem() {
    if (!isApiEnabled()) {
      removeReceiptItem(currentItem.id)
      goBack()
      return
    }

    if (!householdId) {
      setError('Sign in again to remove this item.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await deleteReceiptItem(householdId, currentItem.receiptId, currentItem.id)
      removeReceiptItem(currentItem.id)
      useStore.setState((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt.id === currentItem.receiptId
            ? { ...receipt, itemIds: receipt.itemIds.filter((id) => id !== currentItem.id) }
            : receipt,
        ),
      }))
      goBack()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell topBar={<TopBar title="Item Detail" showBack />}>
      <div className="flex items-center gap-4 py-2">
        <CategoryIcon
          icon={cat?.icon ?? '🧾'}
          color={cat?.color ?? '#16A34A'}
          size={88}
          className="rounded-full text-4xl"
        />
        <div>
          <h2 className="text-[24px] font-extrabold text-ink">{item.name}</h2>
          <MoneyText amount={item.amount} className="text-[30px] font-extrabold text-ink" />
        </div>
      </div>

      <div className="mt-1 flex flex-wrap gap-2">
        {cat && <Chip color={cat.color}>{cat.name}</Chip>}
        <span className="inline-flex items-center gap-1 rounded-pill bg-greenSoft px-3 py-1.5 text-[13px] font-semibold text-green">
          <Sparkles size={14} /> AI {confidence}% confident
        </span>
      </div>

      <div className="mt-5 space-y-3 border-t border-line/70 pt-4 text-[15px]">
        <Row label="Merchant" value={receipt?.merchant ?? '—'} />
        <Row label="Date" value={receipt ? formatDateTime(receipt.date) : '—'} />
        <div className="flex items-start justify-between">
          <span className="font-semibold text-muted">Tags</span>
          <div className="flex items-center gap-2">
            {item.tagIds.map((id) => {
              const t = tag(id)
              return t ? (
                <Chip key={id} color={t.color}>
                  {t.name}
                </Chip>
              ) : null
            })}
            <button
              onClick={() => setTagPickerOpen(true)}
              aria-label="Edit tags"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-line/40 text-muted active:bg-line/70"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
        <Row label="Receipt ID" value={`#${(receipt?.id ?? '').slice(-8).toUpperCase() || 'N/A'}`} />
      </div>

      <h3 className="mt-6 text-[19px] font-extrabold text-ink">Source Receipt</h3>
      {error && (
        <p className="mt-3 rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
      )}
      <div className="mt-3 flex gap-4">
        <button onClick={() => setOpenReceipt(true)} className="w-32 shrink-0">
          <ReceiptThumbnail
            receiptId={receipt?.id}
            uploadId={receipt?.uploadId}
            imageUrl={receipt?.imageUrl}
            className="h-40 w-32 border border-line"
          />
        </button>
        <div className="flex-1">
          <p className="text-[15px] leading-snug text-muted">
            This item was detected from your scanned receipt.
          </p>
          <ActionButton
            variant="greenOutline"
            className="mt-4"
            leftIcon={<FileText size={18} />}
            onClick={() => setOpenReceipt(true)}
          >
            Open Receipt
          </ActionButton>
        </div>
      </div>

      <button
        onClick={() => setConfirmRemove(true)}
        className="mt-8 flex items-center gap-2 text-[16px] font-bold text-red active:opacity-70"
      >
        <Trash2 size={20} /> Remove This Item
      </button>

      {/* Receipt viewer */}
      <Modal
        open={openReceipt}
        onClose={() => setOpenReceipt(false)}
        title={receipt?.merchant}
        variant="center"
      >
        {receiptImageUrl ? (
          <img
            src={receiptImageUrl}
            alt="receipt"
            className="max-h-[70vh] w-full rounded-input object-contain"
          />
        ) : (
          <pre className="max-h-[70vh] overflow-auto rounded-input bg-[#FAF6F0] p-4 font-mono text-[12px] leading-relaxed text-ink/80">
            {receipt?.ocrText ?? 'No receipt image available.'}
          </pre>
        )}
      </Modal>

      {/* Tag picker */}
      <Modal open={tagPickerOpen} onClose={() => setTagPickerOpen(false)} title="Edit Tags" variant="center">
        {tags.length === 0 ? (
          <p className="text-center text-[14px] text-muted">
            No tags yet — create some in Categories & Tags.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const active = item.tagIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    void updateTags(active ? item.tagIds.filter((id) => id !== t.id) : [...item.tagIds, t.id])
                  }
                  disabled={saving}
                  className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-[13px] font-semibold transition ${
                    active ? 'border-transparent text-white' : 'border-line bg-surface text-ink'
                  }`}
                  style={active ? { backgroundColor: t.color } : undefined}
                >
                  {active && <Check size={13} />}
                  {t.name}
                </button>
              )
            })}
          </div>
        )}
        <ActionButton className="mt-5" onClick={() => setTagPickerOpen(false)}>
          Done
        </ActionButton>
      </Modal>

      {/* Confirm remove */}
      <Modal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remove item?"
        variant="center"
      >
        <p className="text-[15px] text-muted">This will remove “{item.name}” from the receipt.</p>
        <div className="mt-5 flex gap-3">
          <ActionButton variant="ghost" onClick={() => setConfirmRemove(false)}>
            Cancel
          </ActionButton>
          <ActionButton variant="danger" onClick={() => void removeItem()} disabled={saving}>
            {saving ? 'Removing…' : 'Remove'}
          </ActionButton>
        </div>
      </Modal>
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold text-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}
