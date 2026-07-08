import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Clock, ArrowUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { DealReportRow } from '@/components/deals/DealReportRow'
import { useStore } from '@/store/appStore'

type Filter = 'all' | 'on_sale' | 'watchlist'

function dateKey(value: string): string {
  return value.split('T')[0]
}

function formatUpdatedAt(value?: string): string {
  if (!value) return 'Not checked yet'
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function TodaysDealReport() {
  const navigate = useNavigate()
  const deals = useStore((s) => s.deals)
  const shoppingList = useStore((s) => s.shoppingList)
  const addDealToShoppingList = useStore((s) => s.addDealToShoppingList)
  const keepWatchingDeal = useStore((s) => s.keepWatchingDeal)
  const [filter, setFilter] = useState<Filter>('on_sale')
  const today = new Date().toISOString().split('T')[0]
  const todaysDeals = deals.filter((deal) => dateKey(deal.foundAt) === today)

  const visible = todaysDeals.filter((d) => {
    if (filter === 'watchlist') return d.actionStatus === 'keep_watching'
    if (filter === 'on_sale') return d.actionStatus !== 'skipped' && d.discountPercent > 0
    return d.actionStatus !== 'skipped'
  })
  const sortedTodaysDeals = [...todaysDeals].sort((a, b) => a.foundAt.localeCompare(b.foundAt))
  const latestFoundAt = sortedTodaysDeals[sortedTodaysDeals.length - 1]?.foundAt
  const averageDiscount =
    visible.length > 0
      ? Math.round(visible.reduce((total, deal) => total + deal.discountPercent, 0) / visible.length)
      : 0

  const inList = (id: string) => shoppingList.some((s) => s.dealId === id)

  return (
    <AppShell topBar={<TopBar title="Today's Deal Report" showBack />}>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'on_sale', label: 'On Sale' },
          { value: 'watchlist', label: 'Watchlist' },
        ]}
      />

      {/* Summary */}
      <Card className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-greenSoft">
          <TrendingUp size={24} className="text-green" />
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-extrabold leading-tight text-ink">
            <span className="text-green">{visible.length}</span> matching deals found today
          </p>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-muted">
            <Clock size={12} /> Updated {formatUpdatedAt(latestFoundAt)}
          </p>
        </div>
        {averageDiscount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-pill bg-greenSoft px-2 py-1 text-[12px] font-bold text-green">
            <ArrowUp size={12} /> {averageDiscount}%
          </span>
        )}
      </Card>

      <div className="mt-4 space-y-3 pb-4">
        {visible.map((deal) => (
          <DealReportRow
            key={deal.id}
            deal={deal}
            added={inList(deal.id)}
            onView={() => navigate('/deal-cards', { state: { dealId: deal.id } })}
            onAdd={() => addDealToShoppingList(deal.id)}
            onSave={() => keepWatchingDeal(deal.id)}
          />
        ))}
        {visible.length === 0 && (
          <p className="py-10 text-center text-muted">
            {todaysDeals.length === 0
              ? "Run a deal check from your watchlist to refresh today's deals."
              : 'No deals in this filter.'}
          </p>
        )}
      </div>
    </AppShell>
  )
}
