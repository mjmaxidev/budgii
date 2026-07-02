import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Bot, LineChart, Plus, RefreshCw, ShoppingBag, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { FloatingActionButton } from '@/components/layout/FloatingActionButton'
import { DealWatchlistCard } from '@/components/deals/DealWatchlistCard'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { useStore } from '@/store/appStore'
import { cn } from '@/utils/cn'
import { withFrom } from '@/utils/navigation'

export function DealWatchlist() {
  const navigate = useNavigate()
  const items = useStore((s) => s.watchlistItems)
  const addWatchlistItem = useStore((s) => s.addWatchlistItem)
  const removeWatchlistItem = useStore((s) => s.removeWatchlistItem)
  const runCheck = useStore((s) => s.mockRunDailyDealCheck)
  const [edit, setEdit] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [merchant, setMerchant] = useState('')
  const [price, setPrice] = useState('')

  function add() {
    if (!name.trim()) return
    addWatchlistItem({
      name: name.trim(),
      merchant: merchant.trim() || 'Any store',
      currentPrice: parseFloat(price) || undefined,
      status: 'watching',
    })
    setName('')
    setMerchant('')
    setPrice('')
    setModal(false)
  }

  const allSelected = items.length > 0 && selected.size === items.length

  function toggleEdit() {
    setEdit((v) => {
      if (v) setSelected(new Set()) // leaving edit mode clears the selection
      return !v
    })
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))
  }

  function confirmDelete() {
    selected.forEach((id) => removeWatchlistItem(id))
    setSelected(new Set())
    setConfirmOpen(false)
    setEdit(false)
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Deal Watchlist"
          showBack
          right={
            <button className="relative" onClick={() => navigate('/notifications', withFrom('/deal-watchlist'))}>
              <Bell size={22} className="text-ink" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-bg" />
            </button>
          }
        />
      }
      fab={edit ? undefined : <FloatingActionButton onClick={() => setModal(true)} icon={<Plus size={20} />} label="Add Item" />}
    >
      {/* Daily AI deal check */}
      <Card className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-greenSoft">
          <Bot size={28} className="text-green" />
        </div>
        <div className="flex-1">
          <p className="text-[16px] font-extrabold text-ink">Daily AI Deal Check</p>
          <p className="text-[13px] text-muted">Our AI scans prices so you don't have to.</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-green" /> Next report: <span className="text-green">7:00 AM</span>
          </p>
        </div>
        <button
          onClick={() => navigate('/todays-deal-report', withFrom('/deal-watchlist'))}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-greenSoft text-green"
        >
          <LineChart size={22} />
        </button>
      </Card>

      <button
        onClick={() => runCheck()}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-input border border-line bg-surface py-3 text-[14px] font-bold text-green active:bg-greenSoft"
      >
        <RefreshCw size={16} /> Run deal check now (mock)
      </button>

      {/* Tracked items */}
      <div className="mt-5 flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-ink">Tracked Items</h2>
        {items.length > 0 && (
          <button onClick={toggleEdit} className="text-[15px] font-bold text-green">
            {edit ? 'Done' : 'Edit'}
          </button>
        )}
      </div>

      {edit && (
        <div className="mt-3 flex items-center justify-between">
          <button onClick={toggleSelectAll} className="text-[14px] font-semibold text-green">
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={selected.size === 0}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-[14px] font-bold transition',
              selected.size > 0
                ? 'bg-[#FEE2E2] text-[#DC2626] active:bg-[#FBCFCF]'
                : 'bg-line/40 text-muted',
            )}
          >
            <Trash2 size={16} />
            Delete{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        </div>
      )}

      <div className="mt-2 space-y-3 pb-20">
        {items.map((item) => (
          <DealWatchlistCard
            key={item.id}
            item={item}
            selectable={edit}
            selected={selected.has(item.id)}
            onClick={edit ? () => toggleSelect(item.id) : () => navigate('/deal-cards', withFrom('/deal-watchlist'))}
          />
        ))}
        {items.length === 0 && (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <ShoppingBag size={28} className="text-muted" />
            <p className="font-bold text-ink">No tracked items</p>
            <p className="text-[14px] text-muted">Add a product and we'll watch for deals.</p>
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Track a Product">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Preferred store (optional)"
          className="mt-3 w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <input
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Current price (optional)"
          className="mt-3 w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <ActionButton variant="green" className="mt-4" onClick={add}>
          Add to Watchlist
        </ActionButton>
      </Modal>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} variant="center" title="Delete tracked items?">
        <p className="text-[15px] text-muted">
          {selected.size === 1
            ? 'This will remove 1 item from your watchlist.'
            : `This will remove ${selected.size} items from your watchlist.`}{' '}
          This can't be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <ActionButton variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>
            Cancel
          </ActionButton>
          <button
            onClick={confirmDelete}
            className="flex-1 rounded-pill bg-[#DC2626] py-3 text-center text-[15px] font-bold text-white active:bg-[#B91C1C]"
          >
            Delete
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}
