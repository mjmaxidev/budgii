import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { useStore } from '@/store/appStore'
import { breakdownByCategory, sumExpenses } from '@/store/selectors'
import { formatMoney, formatMoneyShort, percent } from '@/utils/money'
import { sumOngoingIncome } from '@/utils/income'
import { useLookups } from '@/store/lookups'

export function MonthlySummary() {
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const expenses = useStore((s) => s.expenses)
  const incomeItems = useStore((s) => s.incomeItems)
  const ongoingIncomes = useStore((s) => s.ongoingIncomes)
  const { category } = useLookups()

  // Calculate date range for selected month
  const year = selectedMonth.getFullYear()
  const month = selectedMonth.getMonth()
  const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]

  // Calculate date range for previous month
  const prevMonth = new Date(year, month - 1)
  const prevYear = prevMonth.getFullYear()
  const prevMonthNum = prevMonth.getMonth()
  const prevFirstDay = new Date(prevYear, prevMonthNum, 1).toISOString().split('T')[0]
  const prevLastDay = new Date(prevYear, prevMonthNum + 1, 0).toISOString().split('T')[0]

  // Get expenses and income for selected month
  const monthExpenses = expenses.filter((e) => e.date >= firstDay && e.date <= lastDay)
  const monthIncome = incomeItems.filter((i) => i.date >= firstDay && i.date <= lastDay)

  // Get expenses for previous month
  const prevMonthExpenses = expenses.filter((e) => e.date >= prevFirstDay && e.date <= prevLastDay)

  // Calculate totals
  const totalSpending = sumExpenses(monthExpenses)
  const totalIncome = monthIncome.reduce((sum, item) => sum + item.amount, 0) + sumOngoingIncome(ongoingIncomes)
  const netAmount = totalIncome - totalSpending

  const prevTotalSpending = sumExpenses(prevMonthExpenses)
  const spendingChange = totalSpending - prevTotalSpending
  const spendingChangePercent = prevTotalSpending > 0 ? Math.round((spendingChange / prevTotalSpending) * 100) : 0

  // Category breakdown
  const categoryBreakdown = breakdownByCategory(monthExpenses)

  // Month navigation
  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))
  }

  const monthName = selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const prevMonthName = prevMonth.toLocaleDateString('en-US', { month: 'short' })

  return (
    <AppShell
      showBottomNav
      topBar={<TopBar title="Monthly Summary" showBack onBack={() => navigate(-1)} />}
    >
      {/* Month Selector */}
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={handlePrevMonth}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-line/20 active:bg-line/30"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
        <h2 className="text-center text-[18px] font-bold text-ink">{monthName}</h2>
        <button
          onClick={handleNextMonth}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-line/20 active:bg-line/30"
        >
          <ChevronRight size={22} className="text-ink" />
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="space-y-3 px-4">
        {/* Total Income */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-muted">Total Income</p>
            <MoneyText amount={totalIncome} className="text-[22px] font-extrabold" />
          </div>
          <div className="text-[32px]">💰</div>
        </Card>

        {/* Total Spending */}
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-muted">Total Spending</p>
            <MoneyText amount={totalSpending} className="text-[22px] font-extrabold" />
          </div>
          <div className="text-[32px]">💸</div>
        </Card>

        {/* Spending Change from Previous Month */}
        {prevTotalSpending > 0 && (
          <Card
            className="flex items-center justify-between"
            style={{
              backgroundColor: spendingChange > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
            }}
          >
            <div>
              <p className="text-[13px] text-muted">vs {prevMonthName}</p>
              <div className="flex items-center gap-2">
                {spendingChange > 0 ? (
                  <TrendingUp size={20} className="text-red" />
                ) : (
                  <TrendingDown size={20} className="text-green" />
                )}
                <MoneyText amount={Math.abs(spendingChange)} className="text-[18px] font-bold" />
                <span className={`text-[14px] font-semibold ${spendingChange > 0 ? 'text-red' : 'text-green'}`}>
                  {spendingChange > 0 ? '+' : '-'}{Math.abs(spendingChangePercent)}%
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Net Amount */}
        <Card
          className="flex items-center justify-between"
          style={{
            backgroundColor: netAmount >= 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div>
            <p className="text-[13px] text-muted">Net Amount</p>
            <MoneyText
              amount={netAmount}
              className={`text-[22px] font-extrabold ${netAmount >= 0 ? 'text-green' : 'text-red'}`}
            />
          </div>
          <div className="text-[32px]">{netAmount >= 0 ? '✨' : '⚠️'}</div>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="mt-6 px-4">
        <h3 className="mb-3 text-[16px] font-bold text-ink">Spending by Category</h3>

        {categoryBreakdown.length === 0 ? (
          <Card className="py-6 text-center">
            <p className="text-[14px] text-muted">No expenses this month</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {categoryBreakdown.map((breakdown) => {
              const cat = category(breakdown.id)
              return (
                <Card
                  key={breakdown.id}
                  className="flex cursor-pointer items-center justify-between py-3 hover:bg-line/20"
                  onClick={() => navigate('/spending-breakdown')}
                >
                  <div className="flex items-center gap-3">
                    {cat && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                        <CategoryIcon icon={cat.icon} color={cat.color} size={20} />
                      </div>
                    )}
                    <div>
                      <p className="text-[14px] font-semibold text-ink">{cat?.name ?? 'Unknown'}</p>
                      <p className="text-[12px] text-muted">{breakdown.percent}% of total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-bold text-ink">{formatMoneyShort(breakdown.total)}</p>
                  </div>
                </Card>
              )
            })}

            {/* Category Summary Bar */}
            <div className="mt-4 space-y-2">
              <p className="text-[12px] font-semibold text-muted">BREAKDOWN</p>
              <div className="flex h-2 gap-1 overflow-hidden rounded-full bg-line">
                {categoryBreakdown.map((breakdown, idx) => {
                  const cat = category(breakdown.id)
                  return (
                    <div
                      key={idx}
                      className="rounded-full transition-all"
                      style={{
                        width: `${breakdown.percent}%`,
                        backgroundColor: cat?.color ?? '#ccc',
                        minWidth: breakdown.percent > 0 ? '2px' : '0',
                      }}
                    />
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryBreakdown.slice(0, 5).map((breakdown) => {
                  const cat = category(breakdown.id)
                  return (
                    <div key={breakdown.id} className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat?.color ?? '#ccc' }} />
                      <span className="text-[11px] text-muted">{cat?.name ?? 'Other'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 space-y-2 px-4 pb-8">
        <Card className="space-y-2 py-4">
          <div className="flex justify-between px-3">
            <span className="text-[13px] text-muted">Transactions this month</span>
            <span className="text-[14px] font-semibold text-ink">{monthExpenses.length}</span>
          </div>
          <div className="flex justify-between border-t border-line px-3 pt-2">
            <span className="text-[13px] text-muted">Avg. daily spending</span>
            <span className="text-[14px] font-semibold text-ink">
              {formatMoneyShort(totalSpending / (new Date(year, month + 1, 0).getDate() || 1))}
            </span>
          </div>
          <div className="flex justify-between border-t border-line px-3 pt-2">
            <span className="text-[13px] text-muted">Income sources</span>
            <span className="text-[14px] font-semibold text-ink">{monthIncome.length}</span>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
