import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Info, X, Binoculars, Check, ShoppingCart, PartyPopper } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { DealSwipeCard } from '@/components/deals/DealSwipeCard'
import { useStore } from '@/store/appStore'

export function DealCards() {
  const navigate = useNavigate()
  const location = useLocation()
  const deals = useStore((s) => s.deals)
  const skipDeal = useStore((s) => s.skipDeal)
  const keepWatchingDeal = useStore((s) => s.keepWatchingDeal)
  const addDealToShoppingList = useStore((s) => s.addDealToShoppingList)
  const selectedDealId = (location.state as { dealId?: string } | null)?.dealId
  const reviewableDeals = deals.filter((deal) => deal.actionStatus === 'new')
  const selectedDeal =
    selectedDealId && deals.find((deal) => deal.id === selectedDealId && deal.actionStatus !== 'skipped')
  const cards = selectedDeal
    ? [selectedDeal, ...reviewableDeals.filter((deal) => deal.id !== selectedDeal.id)]
    : reviewableDeals
  const [index, setIndex] = useState(0)
  const [showInfo, setShowInfo] = useState(false)

  const total = cards.length
  const current = cards[index]
  const done = index >= total

  function advance() {
    setIndex((i) => i + 1)
  }

  function handleCurrentAction(action: (dealId: string) => void) {
    if (!current) return
    const shouldAdvance = current.actionStatus !== 'new'
    action(current.id)
    if (shouldAdvance) advance()
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Deal Cards"
          showBack
          right={
            <button
              onClick={() => setShowInfo(true)}
              aria-label="How deal cards work"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted active:bg-line/40"
            >
              <Info size={18} />
            </button>
          }
        />
      }
      scrollClassName="overflow-hidden"
    >
      <p className="mb-4 text-center text-[14px] font-semibold text-muted">Review new deals from your watchlist</p>

      {done ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <PartyPopper size={48} className="text-primary" />
          <h2 className="text-[20px] font-extrabold text-ink">You're all caught up!</h2>
          <p className="max-w-[260px] text-[15px] text-muted">You've reviewed every deal for today. Check your shopping list for what you saved.</p>
          <div className="mt-3 w-full max-w-[280px] space-y-3">
            <ActionButton variant="green" onClick={() => navigate('/shopping-list')}>
              View Shopping List
            </ActionButton>
            <ActionButton variant="outline" onClick={() => setIndex(0)}>
              Review Again
            </ActionButton>
          </div>
        </div>
      ) : (
        <>
          {/* Card stack */}
          <div className="relative mx-auto h-[460px] w-full max-w-[340px]">
            {cards.slice(index, index + 3).map((deal, i) => (
              <DealSwipeCard key={deal.id} deal={deal} depth={i} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-[13px] font-semibold text-muted">
              {index + 1} of {total}
            </p>
            <div className="flex gap-1.5">
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-green' : 'w-2 bg-line'}`}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          <div className="mt-4 flex items-center justify-center gap-2 rounded-input border border-line bg-surface px-4 py-3">
            <ShoppingCart size={18} className="text-primary" />
            <span className="text-[15px] font-semibold text-ink">Add this to today's shopping list?</span>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-start justify-around">
            <SwipeAction
              color="#EF4444"
              icon={<X size={28} />}
              label="Skip"
              onClick={() => handleCurrentAction(skipDeal)}
            />
            <SwipeAction
              color="#6B7280"
              icon={<Binoculars size={26} />}
              label="Keep Watching"
              onClick={() => handleCurrentAction(keepWatchingDeal)}
            />
            <SwipeAction
              color="#16A34A"
              icon={<Check size={28} />}
              label="Add to List"
              onClick={() => handleCurrentAction(addDealToShoppingList)}
            />
          </div>
        </>
      )}

      <Modal open={showInfo} onClose={() => setShowInfo(false)} title="How deal cards work" variant="center">
        <div className="space-y-3 text-[14px] leading-snug text-muted">
          <p>
            Each card is a deal found on an item from your watchlist. Review them one at a time:
          </p>
          <p>
            <span className="font-bold text-[#EF4444]">Skip</span> — not interested, hide this deal.
          </p>
          <p>
            <span className="font-bold text-[#6B7280]">Keep Watching</span> — not yet, keep tracking the price.
          </p>
          <p>
            <span className="font-bold text-green">Add to List</span> — good deal, add it to your shopping list.
          </p>
        </div>
      </Modal>
    </AppShell>
  )
}

function SwipeAction({ color, icon, label, onClick }: { color: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full bg-surface shadow-ring active:scale-90"
        style={{ color }}
      >
        {icon}
      </span>
      <span className="text-[13px] font-bold" style={{ color }}>
        {label}
      </span>
    </button>
  )
}
