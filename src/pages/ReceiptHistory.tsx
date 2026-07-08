import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Edit2, MoreVertical } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ReceiptThumbnail } from '@/components/receipts/ReceiptThumbnail'
import { MoneyText } from '@/components/ui/MoneyText'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { deleteReceipt as apiDeleteReceipt } from '@/api/receipts'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'
import { useReceiptImageUrl } from '@/hooks/useReceiptImageUrl'
import { formatDate } from '@/utils/dates'
import { withFrom } from '@/utils/navigation'

const PAGE_SIZE = 20

export function ReceiptHistory() {
  const navigate = useNavigate()
  const receipts = useStore((s) => s.receipts)
  const deleteReceipt = useStore((s) => s.deleteReceipt)
  const householdId = useAuthStore((s) => s.householdId)
  const [query, setQuery] = useState('')
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(
    () =>
      [...receipts]
        .filter((r) => r.merchant.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [receipts, query],
  )
  const visibleReceipts = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, receipts.length])

  const selectedReceipt = filtered.find((r) => r.id === selectedReceiptId)
  const selectedReceiptImageUrl = useReceiptImageUrl({
    receiptId: selectedReceipt?.id,
    uploadId: selectedReceipt?.uploadId,
    imageUrl: selectedReceipt?.imageUrl,
  })

  const handleDeleteReceipt = async (id: string) => {
    if (isApiEnabled()) {
      if (!householdId) {
        setError('Sign in again to delete this receipt.')
        return
      }
      setDeleting(true)
      setError('')
      try {
        await apiDeleteReceipt(householdId, id)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not delete receipt')
        setDeleting(false)
        return
      }
    }
    deleteReceipt(id)
    setConfirmDeleteId(null)
    setDeleting(false)
    if (selectedReceiptId === id) setSelectedReceiptId(null)
  }

  const handleViewReceipt = (receiptId: string) => {
    setSelectedReceiptId(receiptId)
  }

  const handleEditItem = (itemId: string) => {
    setSelectedReceiptId(null)
    navigate(`/item/${itemId}`, withFrom('/receipt-history'))
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Receipt History" showBack />}>
      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-input border border-line bg-surface px-4 min-h-[50px]">
        <Search size={18} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search merchant"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted/70"
        />
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 px-1 text-[12px] font-semibold text-muted">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} receipts
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No receipts yet"
            description="Scan your first receipt to get started."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {visibleReceipts.map((receipt) => (
            <Card
              key={receipt.id}
              className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-line/20 active:bg-line/30"
              onClick={() => handleViewReceipt(receipt.id)}
            >
              {/* Thumbnail */}
              <div className="shrink-0">
                <ReceiptThumbnail
                  receiptId={receipt.id}
                  uploadId={receipt.uploadId}
                  imageUrl={receipt.imageUrl}
                  className="h-[80px] w-[64px] border border-line/50"
                  rounded="rounded-lg"
                />
              </div>

              {/* Receipt info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-ink truncate">{receipt.merchant}</h3>
                <p className="text-[13px] text-muted">{formatDate(receipt.date)}</p>
                <p className="text-[13px] text-muted">
                  {receipt.itemIds.length} item{receipt.itemIds.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Total amount */}
              <div className="shrink-0 text-right">
                <MoneyText amount={receipt.total} className="text-[18px] font-extrabold text-ink" />
              </div>

              {/* Status indicator */}
              <div className="shrink-0 text-[12px] font-semibold">
                <span
                  className={`inline-block px-2 py-1 rounded-full ${
                    receipt.status === 'processed'
                      ? 'bg-greenSoft text-green'
                      : receipt.status === 'analyzing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : receipt.status === 'needs_review'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                  }`}
                >
                  {receipt.status === 'processed'
                    ? '✓'
                    : receipt.status === 'analyzing'
                      ? '⟳'
                      : receipt.status === 'needs_review'
                        ? '!'
                        : '✕'}
                </span>
              </div>
            </Card>
          ))}
          {hasMore && (
            <ActionButton
              size="md"
              variant="greenOutline"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load More Receipts
            </ActionButton>
          )}
        </div>
      )}

      {/* Receipt detail modal */}
      <Modal
        open={!!selectedReceipt}
        onClose={() => setSelectedReceiptId(null)}
        title={selectedReceipt?.merchant}
        variant="center"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            {/* Receipt image */}
            {selectedReceiptImageUrl ? (
              <img
                src={selectedReceiptImageUrl}
                alt="receipt"
                className="max-h-[50vh] w-full rounded-input object-contain"
              />
            ) : (
              <pre className="max-h-[50vh] overflow-auto rounded-input bg-[#FAF6F0] p-4 font-mono text-[12px] leading-relaxed text-ink/80">
                {selectedReceipt.ocrText ?? 'No receipt image available.'}
              </pre>
            )}

            {/* Receipt details */}
            <div className="space-y-2 border-t border-line/70 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-muted">Date</span>
                <span className="text-[14px] text-ink">{formatDate(selectedReceipt.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-muted">Total</span>
                <MoneyText amount={selectedReceipt.total} className="text-[16px] font-bold text-ink" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-muted">Items</span>
                <span className="text-[14px] text-ink">{selectedReceipt.itemIds.length}</span>
              </div>
            </div>

            {/* Items list */}
            {selectedReceipt.itemIds.length > 0 && (
              <div className="border-t border-line/70 pt-4">
                <h4 className="mb-3 text-[14px] font-bold text-ink">Items</h4>
                <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                  {selectedReceipt.itemIds.map((itemId) => {
                    const item = useStore.getState().receiptItems.find((i) => i.id === itemId)
                    if (!item) return null
                    return (
                      <button
                        key={itemId}
                        onClick={() => handleEditItem(itemId)}
                        className="w-full flex items-center justify-between rounded-lg bg-line/10 p-3 text-left hover:bg-line/20 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-ink truncate">{item.name}</p>
                          <p className="text-[12px] text-muted">
                            AI {Math.round(item.aiConfidence * 100)}% confident
                          </p>
                        </div>
                        <MoneyText
                          amount={item.amount}
                          className="ml-2 shrink-0 text-[14px] font-bold text-ink"
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 border-t border-line/70 pt-4">
              <ActionButton
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setSelectedReceiptId(null)}
              >
                Close
              </ActionButton>
              <ActionButton
                variant="danger"
                size="md"
                className="flex-1"
                leftIcon={<Trash2 size={16} />}
                onClick={() => setConfirmDeleteId(selectedReceipt.id)}
              >
                Delete
              </ActionButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete receipt?"
        variant="center"
      >
        <p className="text-[15px] text-muted">This will permanently remove the receipt and all its items.</p>
        {error && (
          <p className="mt-3 rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <ActionButton variant="ghost" onClick={() => setConfirmDeleteId(null)}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => {
              if (confirmDeleteId) void handleDeleteReceipt(confirmDeleteId)
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </ActionButton>
        </div>
      </Modal>
    </AppShell>
  )
}
