import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Telescope, Bell, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { MoneyText } from '@/components/ui/MoneyText'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { useStore } from '@/store/appStore'
import { breakdownByCategory, expensesInPeriod, sumExpenses } from '@/store/selectors'
import { getBudgetStatus, statusColor } from '@/utils/budget'
import type { Period } from '@/types'
import { useLookups } from '@/store/lookups'
import { formatMoneyShort } from '@/utils/money'
import { withFrom } from '@/utils/navigation'
import { isApiEnabled } from '@/api/config'
import { evaluateSpendingAlerts } from '@/api/alerts'
import { useAuthStore } from '@/store/authStore'
import type { SpendingAlertEvaluation } from '@/api/types'

const periodDivisor: Record<Period, number> = { daily: 30, weekly: 30 / 7, monthly: 1 }

// Helper to get current month range
function getMonthRange() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { startDate, endDate }
}

export function Home() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('monthly')
  // Category carousel paging — track which card is leftmost so the dots
  // below the strip show the user it's swipeable.
  const carouselRef = useRef<HTMLDivElement>(null)
  const [activeCard, setActiveCard] = useState(0)
  const expenses = useStore((s) => s.expenses)
  const budget = useStore((s) => s.budget)
  const userProfile = useStore((s) => s.userProfile)
  const getTotalIncome = useStore((s) => s.getTotalIncome)
  const householdId = useAuthStore((s) => s.householdId)
  const apiUser = useAuthStore((s) => s.user)
  const { category } = useLookups()
  const [activeAlerts, setActiveAlerts] = useState<SpendingAlertEvaluation[]>([])
  const displayName = apiUser?.name || userProfile.name || apiUser?.email?.split('@')[0] || 'there'
  const firstName = displayName.trim().split(/\s+/)[0] || 'there'

  const periodExpenses = expensesInPeriod(expenses, period)
  const spent = sumExpenses(periodExpenses)
  const limit = budget.limit / periodDivisor[period]
  const warning = budget.warningThreshold / periodDivisor[period]
  const remaining = limit - spent
  const status = getBudgetStatus(spent, limit, warning)

  // Get monthly summary
  const { startDate, endDate } = getMonthRange()
  const monthlyIncome = getTotalIncome(startDate, endDate)
  const monthlyExpenses = sumExpenses(expenses.filter((e) => e.date >= startDate && e.date <= endDate))
  const monthlyBalance = monthlyIncome - monthlyExpenses

  // Calculate budget progress percentage
  const budgetProgressPercent = limit > 0 ? (spent / limit) * 100 : 0
  const getBudgetColor = () => {
    if (budgetProgressPercent < 50) return '#16A34A' // green
    if (budgetProgressPercent < 80) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  const categoryBreakdown = breakdownByCategory(periodExpenses)
  const ringSegments = categoryBreakdown
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      value: limit > 0 ? c.total / limit : 0,
      color: category(c.id)?.color ?? '#9CA3AF',
    }))
  const cats = categoryBreakdown.slice(0, 4)
  const recent = [...periodExpenses].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4)

  useEffect(() => {
    if (!isApiEnabled() || !householdId) return
    let cancelled = false
    evaluateSpendingAlerts(householdId)
      .then((result) => {
        if (!cancelled) setActiveAlerts(result.alerts.filter((alert) => alert.active))
      })
      .catch(() => {
        if (!cancelled) setActiveAlerts([])
      })
    return () => {
      cancelled = true
    }
  }, [householdId, expenses])

  return (
    <AppShell
      showBottomNav
      topBar={
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/deal-watchlist', withFrom('/home'))}
              className="flex h-10 w-10 items-center justify-center rounded-full active:bg-line/40"
            >
              <Telescope size={24} />
            </button>
            <p className="text-[18px] font-semibold text-ink">
              Hello, <span className="font-extrabold">{firstName}</span>
            </p>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full active:bg-line/40"
              onClick={() => navigate('/notifications', withFrom('/home'))}
            >
              <Bell size={24} className="text-ink" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red ring-2 ring-bg" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <h1 className="text-[20px] font-extrabold text-ink">
              This {period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : 'Month'} Overview
            </h1>
          </div>
        </div>
      }
    >
      <div className="mt-3">
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
      </div>

      {/* Budget Progress Bar */}
      <Card className="mt-3 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[14px] font-semibold text-ink">Budget Progress</p>
          <p className="text-[13px] font-bold" style={{ color: getBudgetColor() }}>
            {Math.min(budgetProgressPercent, 100).toFixed(1)}%
          </p>
        </div>
        <ProgressBar
          progress={Math.min(budgetProgressPercent / 100, 1)}
          color={getBudgetColor()}
          className="w-full"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[12px] text-muted">
            {formatMoneyShort(spent)} of {formatMoneyShort(limit)}
          </p>
          <button
            onClick={() => navigate('/spending-breakdown', withFrom('/home'))}
            className="flex items-center gap-0.5 text-[13px] font-bold text-primary active:opacity-70"
          >
            Spending Breakdown
            <ChevronRight size={16} />
          </button>
        </div>
      </Card>

      {activeAlerts.length > 0 && (
        <Card className="mt-3 border-red/30 bg-redSoft py-3">
          <button
            onClick={() => navigate('/spending-alerts', withFrom('/home'))}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p className="text-[14px] font-extrabold text-ink">
                {activeAlerts.length} spending {activeAlerts.length === 1 ? 'alert' : 'alerts'} active
              </p>
              <p className="text-[12px] font-semibold text-red">
                {category(activeAlerts[0].category_id)?.name ?? 'Category'} reached its alert threshold.
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-red" />
          </button>
        </Card>
      )}

      {/* Budget ring */}
      <div className="mt-6 flex items-center justify-between">
        <ProgressRing progress={limit > 0 ? spent / limit : 0} segments={ringSegments} size={190} stroke={16}>
          <span className="text-[14px] text-muted">Spent</span>
          <MoneyText amount={spent} cents={false} className="text-[34px] font-extrabold text-ink" />
          <span className="text-[13px] text-muted">of {formatMoneyShort(limit)}</span>
        </ProgressRing>
        <div className="flex-1 pl-2 text-center">
          <p className="text-[14px] text-muted">Remaining</p>
          <p
            className="text-[30px] font-extrabold"
            style={{ color: remaining >= 0 ? statusColor.good : statusColor.over }}
          >
            {formatMoneyShort(Math.max(remaining, 0))}
          </p>
          <p className="text-[13px] text-muted">{remaining >= 0 ? 'Left to spend' : 'Over budget'}</p>
        </div>
      </div>

      {/* Category mini cards */}
      <div
        ref={carouselRef}
        onScroll={(e) => {
          // Card = 100px wide + 12px gap → 112px step. Round to nearest to find
          // the leftmost card and light its dot.
          const i = Math.round(e.currentTarget.scrollLeft / 112)
          if (i !== activeCard) setActiveCard(i)
        }}
        className="no-scrollbar mt-6 flex gap-3 overflow-x-auto pb-1"
      >
        {cats.map((c) => {
          const cat = category(c.id)
          if (!cat) return null
          return (
            <Card key={c.id} className="flex w-[100px] shrink-0 flex-col items-center gap-1.5 p-3">
              <CategoryIcon icon={cat.icon} color={cat.color} size={40} />
              <p className="truncate text-[13px] font-semibold text-muted">{cat.name}</p>
              <MoneyText amount={c.total} cents={false} className="text-[16px] font-extrabold text-ink" />
              <p className="text-[12px] text-muted">{c.percent}%</p>
              <ProgressBar progress={c.percent / 100} color={cat.color} className="w-full" />
            </Card>
          )
        })}
        {cats.length === 0 && <p className="py-4 text-[14px] text-muted">No spending yet this period.</p>}
      </div>

      {/* Carousel paging dots — signal the strip is swipeable */}
      {cats.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {cats.map((c, i) => (
            <span
              key={c.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                i === activeCard ? 'w-4 bg-primary' : 'w-1.5 bg-line',
              )}
            />
          ))}
        </div>
      )}

      {/* Recent transactions */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-ink">Recent Transactions</h2>
        <button onClick={() => navigate('/transactions')} className="text-[14px] font-bold text-primary">
          View All
        </button>
      </div>
      <Card className="mt-2 divide-y divide-line/70 px-4 py-0">
        {recent.map((e) => (
          <TransactionRow key={e.id} expense={e} onClick={() => navigate('/transactions')} />
        ))}
        {recent.length === 0 && (
          <p className="py-6 text-center text-[14px] text-muted">No transactions yet.</p>
        )}
      </Card>
    </AppShell>
  )
}
