import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { useStore } from '@/store/appStore'
import { breakdownByCategory, sumExpenses } from '@/store/selectors'
import { useLookups } from '@/store/lookups'
import { monthLabel } from '@/utils/dates'
import type { Expense, IncomeItem } from '@/types'

/**
 * Get expenses for a specific month (year-month offset from today)
 * offset: 0 = current month, -1 = last month, -2 = two months ago, etc.
 */
function getExpensesForMonth(expenses: Expense[], monthOffset: number): Expense[] {
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()

  return expenses.filter((e) => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

/**
 * Get income for a specific month
 */
function getIncomeForMonth(income: IncomeItem[], monthOffset: number) {
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const year = targetDate.getFullYear()
  const month = targetDate.getMonth()

  return income.filter((i) => {
    const d = new Date(i.date)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

function sumIncome(incomeItems: IncomeItem[]): number {
  return incomeItems.reduce((sum, item) => sum + item.amount, 0)
}

function getMonthLabel(monthOffset: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + monthOffset)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

type MonthData = {
  expenses: Expense[]
  income: IncomeItem[]
  categoryBreakdown: ReturnType<typeof breakdownByCategory>
  totalExpenses: number
  totalIncome: number
  netChange: number
}

function computeMonthData(
  expenses: Expense[],
  income: IncomeItem[],
  monthOffset: number,
  category: ReturnType<typeof useLookups>['category']
): MonthData {
  const monthExpenses = getExpensesForMonth(expenses, monthOffset)
  const monthIncome = getIncomeForMonth(income, monthOffset)
  const totalExpenses = sumExpenses(monthExpenses)
  const totalIncome = sumIncome(monthIncome)
  const categoryBreakdown = breakdownByCategory(monthExpenses)

  return {
    expenses: monthExpenses,
    income: monthIncome,
    categoryBreakdown,
    totalExpenses,
    totalIncome,
    netChange: totalIncome - totalExpenses,
  }
}

export function BudgetComparison() {
  const [monthOffset, setMonthOffset] = useState(-1) // Start with last month
  const expenses = useStore((s) => s.expenses)
  const incomeItems = useStore((s) => s.incomeItems)
  const { category } = useLookups()

  // Current month and previous month for comparison
  const currentMonth = computeMonthData(expenses, incomeItems, 0, category)
  const comparisonMonth = computeMonthData(expenses, incomeItems, monthOffset, category)

  const currentLabel = getMonthLabel(0)
  const comparisonLabel = getMonthLabel(monthOffset)

  // Calculate percent differences
  const spendingDiffPercent =
    comparisonMonth.totalExpenses > 0
      ? Math.round(
          ((currentMonth.totalExpenses - comparisonMonth.totalExpenses) / comparisonMonth.totalExpenses) * 100
        )
      : 0

  const incomeDiffPercent =
    comparisonMonth.totalIncome > 0
      ? Math.round(((currentMonth.totalIncome - comparisonMonth.totalIncome) / comparisonMonth.totalIncome) * 100)
      : 0

  const netDiffPercent =
    Math.abs(comparisonMonth.netChange) > 0
      ? Math.round(
          ((currentMonth.netChange - comparisonMonth.netChange) / Math.abs(comparisonMonth.netChange)) * 100
        )
      : 0

  const getDiffColor = (percent: number, isNegative: boolean = false) => {
    if (isNegative) {
      return percent < 0 ? 'text-green' : 'text-red'
    }
    return percent > 0 ? 'text-red' : 'text-green'
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Budget Comparison" showBack />}>
      {/* Month Picker */}
      <div className="sticky top-0 z-10 bg-bg px-4 py-3">
        <div className="flex items-center justify-between rounded-lg bg-surfaceSoft px-3 py-2">
          <button
            onClick={() => setMonthOffset(monthOffset - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full active:bg-line/40"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium text-muted">Compare to</p>
            <p className="text-[15px] font-bold text-ink">{comparisonLabel}</p>
          </div>
          <button
            onClick={() => setMonthOffset(Math.min(monthOffset + 1, -1))}
            disabled={monthOffset >= -1}
            className="flex h-8 w-8 items-center justify-center rounded-full active:bg-line/40 disabled:opacity-40"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Income Card */}
          <Card className="p-3">
            <p className="mb-2 text-xs font-medium text-muted">Income</p>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-muted">{currentLabel}</p>
                <MoneyText amount={currentMonth.totalIncome} className="text-sm font-bold text-ink" />
              </div>
              <div>
                <p className="text-[11px] text-muted">{comparisonLabel}</p>
                <MoneyText amount={comparisonMonth.totalIncome} className="text-sm font-bold text-ink" />
              </div>
              <div className="border-t border-line pt-2">
                <p className="text-[11px] text-muted">Change</p>
                <div className="flex items-baseline gap-1">
                  <MoneyText
                    amount={currentMonth.totalIncome - comparisonMonth.totalIncome}
                    className={`text-sm font-bold ${getDiffColor(incomeDiffPercent)}`}
                  />
                  <span className={`text-xs font-medium ${getDiffColor(incomeDiffPercent)}`}>
                    {incomeDiffPercent >= 0 ? '+' : ''}{incomeDiffPercent}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Spending Card */}
          <Card className="p-3">
            <p className="mb-2 text-xs font-medium text-muted">Spending</p>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] text-muted">{currentLabel}</p>
                <MoneyText amount={currentMonth.totalExpenses} className="text-sm font-bold text-ink" />
              </div>
              <div>
                <p className="text-[11px] text-muted">{comparisonLabel}</p>
                <MoneyText amount={comparisonMonth.totalExpenses} className="text-sm font-bold text-ink" />
              </div>
              <div className="border-t border-line pt-2">
                <p className="text-[11px] text-muted">Change</p>
                <div className="flex items-baseline gap-1">
                  <MoneyText
                    amount={currentMonth.totalExpenses - comparisonMonth.totalExpenses}
                    className={`text-sm font-bold ${getDiffColor(spendingDiffPercent)}`}
                  />
                  <span className={`text-xs font-medium ${getDiffColor(spendingDiffPercent)}`}>
                    {spendingDiffPercent >= 0 ? '+' : ''}{spendingDiffPercent}%
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Net Change Card */}
          <Card className="col-span-2 p-3">
            <p className="mb-2 text-xs font-medium text-muted">Net Change (Income - Spending)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted">{currentLabel}</p>
                <MoneyText
                  amount={currentMonth.netChange}
                  signed
                  className={`text-sm font-bold ${currentMonth.netChange >= 0 ? 'text-green' : 'text-red'}`}
                />
              </div>
              <div>
                <p className="text-[11px] text-muted">{comparisonLabel}</p>
                <MoneyText
                  amount={comparisonMonth.netChange}
                  signed
                  className={`text-sm font-bold ${comparisonMonth.netChange >= 0 ? 'text-green' : 'text-red'}`}
                />
              </div>
            </div>
            <div className="mt-2 border-t border-line pt-2">
              <p className="text-[11px] text-muted">Difference</p>
              <div className="flex items-baseline gap-1">
                <MoneyText
                  amount={currentMonth.netChange - comparisonMonth.netChange}
                  signed
                  className={`text-sm font-bold ${getDiffColor(netDiffPercent, true)}`}
                />
                <span className={`text-xs font-medium ${getDiffColor(netDiffPercent, true)}`}>
                  {netDiffPercent >= 0 ? '+' : ''}{netDiffPercent}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown Comparison */}
        <div>
          <h2 className="mb-3 text-[15px] font-bold text-ink">Spending by Category</h2>
          <Card className="divide-y divide-line overflow-hidden">
            {currentMonth.categoryBreakdown.length > 0 ? (
              currentMonth.categoryBreakdown.map((cat) => {
                const comparisonCat = comparisonMonth.categoryBreakdown.find((c) => c.id === cat.id)
                const catData = category(cat.id)
                const prevAmount = comparisonCat?.total ?? 0
                const diff = cat.total - prevAmount
                const diffPercent = prevAmount > 0 ? Math.round((diff / prevAmount) * 100) : 0

                return (
                  <div key={cat.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-1">
                      <CategoryIcon icon={catData?.icon ?? '📦'} color={catData?.color ?? '#999'} size={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{catData?.name ?? 'Unknown'}</p>
                      <div className="mt-1 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted">{currentLabel}</p>
                          <MoneyText amount={cat.total} cents={false} className="font-bold text-ink" />
                        </div>
                        <div>
                          <p className="text-muted">{comparisonLabel}</p>
                          <MoneyText amount={prevAmount} cents={false} className="font-bold text-ink" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold text-ink">{cat.percent}%</div>
                      <MoneyText
                        amount={diff}
                        cents={false}
                        className={`text-xs font-medium ${getDiffColor(diffPercent)}`}
                      />
                      <p className={`text-[10px] font-medium ${getDiffColor(diffPercent)}`}>
                        {diffPercent >= 0 ? '+' : ''}{diffPercent}%
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted">No spending data for {currentLabel}</p>
              </div>
            )}
          </Card>
        </div>

        {/* All Categories from Comparison Month */}
        {comparisonMonth.categoryBreakdown.length > currentMonth.categoryBreakdown.length && (
          <div>
            <h3 className="mb-2 text-[13px] font-semibold text-muted uppercase">Categories from {comparisonLabel}</h3>
            <Card className="divide-y divide-line overflow-hidden">
              {comparisonMonth.categoryBreakdown.map((cat) => {
                if (currentMonth.categoryBreakdown.some((c) => c.id === cat.id)) {
                  return null
                }
                const catData = category(cat.id)
                return (
                  <div key={cat.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="mt-1">
                      <CategoryIcon icon={catData?.icon ?? '📦'} color={catData?.color ?? '#999'} size={40} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{catData?.name ?? 'Unknown'}</p>
                      <div className="mt-1 text-xs">
                        <p className="text-muted">{comparisonLabel}</p>
                        <MoneyText amount={cat.total} cents={false} className="font-bold text-ink" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold text-ink">{cat.percent}%</div>
                      <p className="text-xs font-medium text-red">Not in {currentLabel}</p>
                    </div>
                  </div>
                )
              })}
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
