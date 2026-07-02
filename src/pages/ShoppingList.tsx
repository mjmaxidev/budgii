import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Plus, Package, Zap } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ActionButton } from '@/components/ui/ActionButton'
import { MoneyText } from '@/components/ui/MoneyText'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'
import { cn } from '@/utils/cn'

export function ShoppingList() {
  const navigate = useNavigate()
  const items = useStore((s) => s.shoppingList)
  const watchlist = useStore((s) => s.watchlistItems)
  const toggle = useStore((s) => s.toggleShoppingItem)
  const remove = useStore((s) => s.removeShoppingItem)
  const addShoppingItem = useStore((s) => s.addShoppingItem)

  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [merchant, setMerchant] = useState('')
  const [price, setPrice] = useState('')

  const total = items.reduce((acc, i) => acc + (i.expectedPrice ?? 0), 0)
  const checked = items.filter((i) => i.checked).length

  function handleAddItem() {
    if (!name.trim()) return
    addShoppingItem({
      name: name.trim(),
      merchant: merchant.trim() || 'Any',
      expectedPrice: parseFloat(price) || undefined,
    })
    setName('')
    setMerchant('')
    setPrice('')
    setModal(false)
  }

  const hasWatchlistItems = watchlist.filter((w) => w.status === 'watching').length > 0

  return (
    <AppShell
      topBar={<TopBar title="Shopping List" showBack />}
      fab={
        <button
          onClick={() => setModal(true)}
          className="absolute bottom-20 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg active:scale-95"
        >
          <Plus size={24} />
        </button>
      }
    >
      {items.length === 0 && watchlist.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<ShoppingCart size={28} />}
            title="Your shopping list is empty"
            description="Add items manually or track deals from your watchlist to build your shopping list."
            action={
              <div className="flex flex-col gap-2">
                <ActionButton variant="green" onClick={() => setModal(true)} leftIcon={<Plus size={18} />}>
                  Add Item
                </ActionButton>
                <ActionButton variant="outline" onClick={() => navigate('/deal-watchlist')} leftIcon={<Zap size={18} />}>
                  View Watchlist
                </ActionButton>
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* Summary Card */}
          {items.length > 0 && (
            <Card className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-muted">Estimated total</p>
                <MoneyText amount={total} className="text-[24px] font-extrabold text-ink" />
              </div>
              <div className="text-right">
                <p className="text-[13px] text-muted">Checked off</p>
                <p className="text-[18px] font-extrabold text-green">
                  {checked}/{items.length}
                </p>
              </div>
            </Card>
          )}

          {/* Manual Items Section */}
          {items.length > 0 && (
            <>
              <div className="mt-4 flex items-center gap-2">
                <Package size={18} className="text-ink" />
                <h3 className="text-[16px] font-bold text-ink">Shopping Items</h3>
              </div>
              <Card className="mt-2 divide-y divide-line/70 px-4 py-0">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <button
                      onClick={() => toggle(item.id)}
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                        item.checked ? 'border-green bg-green text-white' : 'border-line'
                      }`}
                    >
                      {item.checked && <span className="text-[14px] leading-none">✓</span>}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[15px] font-semibold ${item.checked ? 'text-muted line-through' : 'text-ink'}`}>
                        {item.name}
                      </p>
                      {item.merchant && <p className="text-[13px] text-muted">{item.merchant}</p>}
                    </div>
                    {item.expectedPrice != null && (
                      <MoneyText amount={item.expectedPrice} className="text-[15px] font-bold text-ink" />
                    )}
                    <button onClick={() => remove(item.id)} className="rounded-full p-1.5 text-muted active:bg-line/40">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* Tracked Deals Section */}
          {hasWatchlistItems && (
            <>
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-primary" />
                  <h3 className="text-[16px] font-bold text-ink">Tracked Deals</h3>
                </div>
                <button
                  onClick={() => navigate('/deal-watchlist')}
                  className="text-[13px] font-bold text-primary active:opacity-70"
                >
                  View All →
                </button>
              </div>
              <Card className="mt-2 divide-y divide-line/70 px-4 py-0">
                {watchlist
                  .filter((w) => w.status === 'watching')
                  .slice(0, 3)
                  .map((watch) => (
                    <div key={watch.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-ink">{watch.name}</p>
                        <p className="text-[13px] text-muted">{watch.merchant}</p>
                      </div>
                      <div className="ml-2 text-right">
                        {watch.currentPrice && <MoneyText amount={watch.currentPrice} className="text-[14px] font-bold text-primary" />}
                        <p className="text-[11px] text-muted">Watching</p>
                      </div>
                    </div>
                  ))}
              </Card>
              {watchlist.filter((w) => w.status === 'watching').length > 3 && (
                <p className="mt-2 text-center text-[13px] text-muted">+{watchlist.filter((w) => w.status === 'watching').length - 3} more</p>
              )}
            </>
          )}

          {/* Add More Button */}
          <ActionButton variant="outline" className="mt-4" leftIcon={<Plus size={18} />} onClick={() => navigate('/todays-deal-report')}>
            Explore Deals
          </ActionButton>
        </>
      )}

      {/* Add Item Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Shopping Item">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-muted mb-1">Item Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Milk, Bread, Headphones"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted mb-1">Store/Merchant</label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g., Whole Foods, Target"
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted mb-1">Expected Price</label>
            <div className="flex items-center gap-2">
              <span className="text-muted">$</span>
              <input
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModal(false)}
              className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-[15px] font-semibold text-ink active:bg-black/5"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              disabled={!name.trim()}
              className={cn(
                'flex-1 rounded-lg px-4 py-2.5 text-[15px] font-semibold text-white active:scale-95',
                name.trim() ? 'bg-primary' : 'bg-muted opacity-50 cursor-not-allowed'
              )}
            >
              Add Item
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
