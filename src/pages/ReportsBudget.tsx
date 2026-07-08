import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ActionButton } from '@/components/ui/ActionButton'
import { MoneyText } from '@/components/ui/MoneyText'
import { useStore } from '@/store/appStore'
import { dailyCategoryBreakdownThisMonth, expensesInPeriod, sumExpenses } from '@/store/selectors'
import { getBudgetStatus, statusColor } from '@/utils/budget'
import { formatMoneyShort } from '@/utils/money'
import type { Period } from '@/types'
import { withFrom } from '@/utils/navigation'
import { useLookups } from '@/store/lookups'

const periodDivisor: Record<Period, number> = { daily: 30, weekly: 30 / 7, monthly: 1 }

export function ReportsBudget() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('monthly')
  const expenses = useStore((s) => s.expenses)
  const budget = useStore((s) => s.budget)
  const { category } = useLookups()

  const periodExpenses = expensesInPeriod(expenses, period)
  const spent = sumExpenses(periodExpenses)
  const limit = budget.limit / periodDivisor[period]
  const warning = budget.warningThreshold / periodDivisor[period]
  const status = getBudgetStatus(spent, limit, warning)

  const dailyBreakdown = dailyCategoryBreakdownThisMonth(expenses)
  const maxDaily = Math.max(...dailyBreakdown.map((d) => d.total), 1)

  return (
    <AppShell
      showBottomNav
      topBar={
        <TopBar
          title="Reports & Budget"
          right={
            <button
              onClick={() => navigate('/notifications', withFrom('/reports'))}
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-line/40"
            >
              <Bell size={22} />
            </button>
          }
        />
      }
    >
      <SegmentedControl
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ]}
      />

      {/* Spending overview chart */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold text-ink">Spending Overview</h2>
        <button
          onClick={() => navigate('/spending-breakdown', withFrom('/reports'))}
          className="text-[14px] font-bold text-green"
        >
          View Report
        </button>
      </div>
      <Card className="mt-2">
        <div className="flex h-36 items-end gap-[3px]">
          {dailyBreakdown.map((d) => {
            const barHeight = d.total > 0 ? Math.max((d.total / maxDaily) * 100, 8) : 0
            return (
              <div key={d.day} className="flex h-full flex-1 flex-col justify-end">
                {d.total === 0 ? (
                  <div
                    className="h-1 w-full rounded-full border border-dashed border-line/70"
                    title={`Day ${d.day}: no spending`}
                  />
                ) : (
                  <div
                    className="flex w-full flex-col justify-end overflow-hidden rounded-t-sm"
                    style={{ height: `${barHeight}%` }}
                    title={`Day ${d.day}: ${formatMoneyShort(d.total)}`}
                  >
                    {[...d.categories].reverse().map((seg) => {
                      const cat = category(seg.categoryId)
                      const color = cat?.color ?? '#9CA3AF'
                      const label = cat?.name ?? 'Other'
                      return (
                        <div
                          key={seg.categoryId}
                          className="flex w-full items-center justify-center"
                          style={{
                            height: `${(seg.amount / d.total) * 100}%`,
                            backgroundColor: color,
                            minHeight: 2,
                          }}
                          title={`${label}: ${formatMoneyShort(seg.amount)} (${seg.percent}%)`}
                        >
                          {seg.percent >= 25 && barHeight >= 30 && (
                            <span className="text-[8px] font-bold leading-none text-white drop-shadow-sm">
                              {seg.percent}%
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted">
          <span>1</span>
          <span>8</span>
          <span>15</span>
          <span>22</span>
          <span>{dailyBreakdown.length}</span>
        </div>
      </Card>

      {/* Budget settings summary */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold text-ink">Budget Settings</h2>
        <button
          onClick={() => navigate('/budget-setup', withFrom('/reports'))}
          className="text-[14px] font-bold text-primary"
        >
          Adjust Budget
        </button>
      </div>
      <Card className="mt-2 flex justify-between">
        <div>
          <p className="text-[13px] text-muted">Monthly Budget</p>
          <p className="text-[18px] font-extrabold text-ink">{formatMoneyShort(budget.limit)}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-muted">Warning Value</p>
          <p className="text-[18px] font-extrabold text-ink">{formatMoneyShort(budget.warningThreshold)}</p>
        </div>
      </Card>

      {/* Three status rings */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniRing
          label="Good"
          amount={budget.limit * 0.45}
          limit={budget.limit}
          color={statusColor.good}
          caption="Good"
          active={status === 'good'}
        />
        <MiniRing
          label="Warning"
          amount={budget.warningThreshold + 20}
          limit={budget.limit}
          color={statusColor.warning}
          caption="Caution"
          active={status === 'warning'}
        />
        <MiniRing
          label="Over"
          amount={budget.limit * 1.12}
          limit={budget.limit}
          color={statusColor.over}
          caption="Over"
          active={status === 'over'}
        />
      </div>

      {/* Over budget alert */}
      {status === 'over' && (
        <Card className="mt-4 border-red/30 bg-redSoft">
          <div className="flex gap-3">
            <AlertCircle size={24} className="shrink-0 text-red" />
            <div>
              <p className="text-[15px] font-bold text-ink">You've exceeded this period's budget.</p>
              <p className="text-[13px] text-muted">Adjust next month's budget to get back on track.</p>
            </div>
          </div>
          <div className="mt-3">
            <ActionButton
              size="md"
              variant="outline"
              fullWidth
              onClick={() => navigate('/budget-next-month')}
            >
              Adjust Next Month
            </ActionButton>
          </div>
        </Card>
      )}

      {status !== 'over' && (
        <ActionButton
          size="md"
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/budget-next-month')}
        >
          Adjust Next Month
        </ActionButton>
      )}

      {/* Current spend summary */}
      <Card className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted">
            Spent this {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}
          </p>
          <MoneyText amount={spent} className="text-[22px] font-extrabold" />
        </div>
        <ProgressRing
          progress={limit > 0 ? spent / limit : 0}
          size={72}
          stroke={9}
          color={statusColor[status]}
        >
          <span className="text-[12px] font-bold text-ink">{Math.round((spent / (limit || 1)) * 100)}%</span>
        </ProgressRing>
      </Card>
    </AppShell>
  )
}

function MiniRing({
  amount,
  limit,
  color,
  caption,
  active,
}: {
  label: string
  amount: number
  limit: number
  color: string
  caption: string
  active: boolean
}) {
  return (
    <Card
      className={`flex flex-col items-center gap-1 py-3 ${active ? 'ring-2' : ''}`}
      style={active ? { boxShadow: `0 0 0 2px ${color}` } : undefined}
    >
      <ProgressRing progress={amount / limit} size={68} stroke={8} color={color}>
        <span className="text-[12px] font-extrabold text-ink">{formatMoneyShort(amount)}</span>
      </ProgressRing>
      <span className="text-[13px] font-bold" style={{ color }}>
        {caption}
      </span>
    </Card>
  )
}
