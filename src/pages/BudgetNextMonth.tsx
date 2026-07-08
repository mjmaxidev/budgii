import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Minus, Plus, ArrowRight, Sparkles, BarChart3 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { MoneyText } from '@/components/ui/MoneyText'
import { useStore } from '@/store/appStore'
import { breakdownByCategory, expensesInPeriod, sumExpenses } from '@/store/selectors'
import { getBudgetStatus, statusColor, statusLabel } from '@/utils/budget'
import { formatMoneyShort } from '@/utils/money'
import { formatMonthYear } from '@/utils/income'
import { withFrom } from '@/utils/navigation'
import { useLookups } from '@/store/lookups'

const WARNING_PRESETS = [0.4, 0.5, 0.6] as const

function nextMonthParts(ref = new Date()) {
  const d = new Date(ref.getFullYear(), ref.getMonth() + 1, 1)
  return { year: d.getFullYear(), month: d.getMonth(), date: d }
}

export function BudgetNextMonth() {
  const navigate = useNavigate()
  const expenses = useStore((s) => s.expenses)
  const budget = useStore((s) => s.budget)
  const updateBudget = useStore((s) => s.updateBudget)
  const { categories } = useLookups()

  const now = new Date()
  const next = nextMonthParts(now)
  const nextMonthLabel = formatMonthYear(next.year, next.month)
  const nextMonthStart = next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const monthExpenses = useMemo(() => expensesInPeriod(expenses, 'monthly'), [expenses])
  const spentThisMonth = sumExpenses(monthExpenses)
  const currentStatus = getBudgetStatus(spentThisMonth, budget.limit, budget.warningThreshold)
  const categorySpent = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of breakdownByCategory(monthExpenses)) map.set(row.id, row.total)
    return map
  }, [monthExpenses])

  const [limit, setLimit] = useState(budget.limit ? String(budget.limit) : '')
  const [warning, setWarning] = useState(budget.warningThreshold ? String(budget.warningThreshold) : '')
  const [allocations, setAllocations] = useState<Record<string, number>>({ ...budget.categoryAllocations })
  const [error, setError] = useState('')

  const limitNum = parseFloat(limit) || 0
  const warningNum = parseFloat(warning) || 0
  const allocated = Object.values(allocations).reduce((a, b) => a + b, 0)
  const remaining = limitNum - allocated
  const limitDelta = limitNum - budget.limit
  const warningDelta = warningNum - budget.warningThreshold
  const adjustedCategories = categories.filter(
    (c) => (allocations[c.id] ?? 0) !== (budget.categoryAllocations[c.id] ?? 0),
  ).length

  const spendingBasedLimit = Math.max(budget.limit, Math.ceil(spentThisMonth / 50) * 50)

  function setAlloc(id: string, value: number) {
    setAllocations((prev) => ({ ...prev, [id]: Math.max(0, value) }))
  }

  function applyPresetWarning(ratio: number) {
    if (limitNum <= 0) return
    setWarning(String(Math.round(limitNum * ratio)))
  }

  function copyCurrentBudget() {
    setLimit(String(budget.limit))
    setWarning(String(budget.warningThreshold))
    setAllocations({ ...budget.categoryAllocations })
  }

  function matchSpending() {
    setLimit(String(spendingBasedLimit))
    setWarning(String(Math.round(spendingBasedLimit * 0.4)))
  }

  function applyCurrentMonthSpending() {
    const nextAlloc: Record<string, number> = {}
    for (const c of categories) {
      nextAlloc[c.id] = categorySpent.get(c.id) ?? 0
    }
    setAllocations(nextAlloc)
  }

  function smartManage() {
    if (limitNum <= 0) return

    const baseTotal = categories.reduce((sum, c) => sum + (budget.categoryAllocations[c.id] ?? 0), 0)
    const nextAlloc: Record<string, number> = {}

    if (baseTotal > 0 && budget.limit > 0) {
      const scale = limitNum / budget.limit
      for (const c of categories) {
        nextAlloc[c.id] = Math.round((budget.categoryAllocations[c.id] ?? 0) * scale)
      }
      distributeRemainder(
        nextAlloc,
        limitNum,
        categories.map((c) => c.id),
      )
    } else {
      const totalSpent = Array.from(categorySpent.values()).reduce((a, b) => a + b, 0)
      if (totalSpent > 0) {
        for (const c of categories) {
          const spent = categorySpent.get(c.id) ?? 0
          nextAlloc[c.id] = spent > 0 ? Math.round((spent / totalSpent) * limitNum) : 0
        }
        distributeRemainder(
          nextAlloc,
          limitNum,
          categories.map((c) => c.id),
        )
      } else {
        const each = Math.floor(limitNum / categories.length)
        let leftover = limitNum - each * categories.length
        for (const c of categories) {
          nextAlloc[c.id] = each + (leftover > 0 ? 1 : 0)
          if (leftover > 0) leftover -= 1
        }
      }
    }

    setAllocations(nextAlloc)
  }

  function apply() {
    if (warningNum >= limitNum) {
      setError('Warning threshold must be less than the total budget.')
      return
    }
    if (allocated > limitNum) {
      setError('Category plans exceed the total budget.')
      return
    }
    setError('')
    updateBudget({
      limit: limitNum,
      warningThreshold: warningNum,
      categoryAllocations: allocations,
    })
    navigate('/reports')
  }

  return (
    <AppShell topBar={<TopBar title="Plan Next Month" showBack />}>
      <div className="rounded-card bg-gradient-to-br from-primary to-[#e07010] p-5 text-white shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <CalendarDays size={26} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/80">Planning for</p>
            <h2 className="text-[26px] font-extrabold leading-tight">{nextMonthLabel}</h2>
            <p className="mt-1 text-[13px] text-white/85">Takes effect {nextMonthStart}</p>
          </div>
        </div>
      </div>

      <Card className="mt-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted">This month so far</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <MoneyText amount={spentThisMonth} className="text-[24px] font-extrabold" />
            <p className="text-[13px] text-muted">of {formatMoneyShort(budget.limit)} budget</p>
          </div>
          <span
            className="rounded-full px-3 py-1 text-[12px] font-bold"
            style={{ color: statusColor[currentStatus], background: `${statusColor[currentStatus]}18` }}
          >
            {statusLabel[currentStatus]}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-line/50">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, budget.limit > 0 ? (spentThisMonth / budget.limit) * 100 : 0)}%`,
              background: statusColor[currentStatus],
            }}
          />
        </div>
      </Card>

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold text-ink">Next month&apos;s total</p>
            <p className="text-[12px] text-muted">Current: {formatMoneyShort(budget.limit)}</p>
          </div>
          {limitDelta !== 0 && (
            <span className={`text-[13px] font-bold ${limitDelta > 0 ? 'text-orange' : 'text-green'}`}>
              {limitDelta > 0 ? '+' : ''}
              {formatMoneyShort(limitDelta)}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLimit(String(Math.max(0, limitNum - 50)))}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surfaceSoft text-ink active:bg-line/40"
            aria-label="Decrease budget by 50"
          >
            <Minus size={18} />
          </button>
          <div className="flex flex-1 items-center rounded-input border border-line bg-surface px-3">
            <span className="text-[18px] text-muted">$</span>
            <input
              inputMode="numeric"
              value={limit}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ''))}
              className="w-full bg-transparent py-3 text-center text-[28px] font-extrabold text-primary outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setLimit(String(limitNum + 50))}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surfaceSoft text-ink active:bg-line/40"
            aria-label="Increase budget by 50"
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <QuickChip label="Copy current" onClick={copyCurrentBudget} />
          {spentThisMonth > budget.limit && (
            <QuickChip
              label={`Match spending (${formatMoneyShort(spendingBasedLimit)})`}
              onClick={matchSpending}
              highlight
            />
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-[15px] font-bold text-ink">Alert threshold</p>
        <p className="text-[12px] text-muted">When spending reaches this amount next month.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {WARNING_PRESETS.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => applyPresetWarning(ratio)}
              className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${
                limitNum > 0 && Math.round(limitNum * ratio) === warningNum
                  ? 'bg-primary text-white'
                  : 'bg-surfaceSoft text-ink active:bg-line/40'
              }`}
            >
              {Math.round(ratio * 100)}%
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center rounded-input border border-line bg-surfaceSoft px-3">
          <span className="text-[15px] text-muted">$</span>
          <input
            inputMode="numeric"
            value={warning}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setWarning(e.target.value.replace(/[^0-9.]/g, ''))}
            className="w-full bg-transparent py-2.5 text-right text-[18px] font-bold text-primary outline-none"
          />
        </div>
      </Card>

      <Card className="mt-4">
        <p className="text-[15px] font-bold text-ink">Category plans</p>
        <p className="text-[12px] text-muted">Tap a row to edit, or auto-fill with the options below.</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={applyCurrentMonthSpending}
            className="flex items-center justify-center gap-1.5 rounded-input border border-line bg-surfaceSoft px-2 py-2.5 text-[12px] font-bold leading-tight text-ink active:bg-line/40"
          >
            <BarChart3 size={14} className="shrink-0 text-green" />
            Current month spending
          </button>
          <button
            type="button"
            onClick={smartManage}
            className="flex items-center justify-center gap-1.5 rounded-input border border-green/40 bg-greenSoft px-2 py-2.5 text-[12px] font-bold leading-tight text-green active:opacity-80"
          >
            <Sparkles size={14} className="shrink-0" />
            Smart manage
          </button>
        </div>

        <div className="mt-3 max-h-[min(52vh,420px)] overflow-y-auto rounded-xl border border-line/70">
          <div className="sticky top-0 z-10 grid grid-cols-[1fr_72px] gap-2 border-b border-line/70 bg-surface px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted">
            <span>Category</span>
            <span className="text-right">Plan</span>
          </div>
          {categories.map((c) => {
            const current = allocations[c.id] ?? 0
            const spent = categorySpent.get(c.id) ?? 0
            const baseline = budget.categoryAllocations[c.id] ?? 0
            const delta = current - baseline
            return (
              <div
                key={c.id}
                className="grid grid-cols-[1fr_72px] items-center gap-2 border-b border-line/40 px-3 py-2 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CategoryIcon icon={c.icon} color={c.color} size={26} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{c.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      Spent {formatMoneyShort(spent)}
                      {delta !== 0 && (
                        <span className={delta > 0 ? ' text-orange' : ' text-green'}>
                          {' '}
                          · {delta > 0 ? '+' : ''}
                          {formatMoneyShort(delta)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center rounded-lg bg-surfaceSoft px-1.5 py-1">
                  <span className="text-[11px] text-muted">$</span>
                  <input
                    inputMode="numeric"
                    value={current}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setAlloc(c.id, parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                    className="w-full bg-transparent py-0.5 text-right text-[14px] font-bold text-primary outline-none"
                    aria-label={`${c.name} plan`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[13px]">
          <span className="text-muted">Allocated</span>
          <span className={`font-bold ${remaining < 0 ? 'text-red' : 'text-ink'}`}>
            {formatMoneyShort(allocated)}
            <span className="text-muted"> / {formatMoneyShort(limitNum)}</span>
          </span>
        </div>
      </Card>

      <Card className={`mt-4 ${remaining < 0 ? 'border-red/40 bg-redSoft' : 'border-green/30 bg-greenSoft'}`}>
        <p className="text-[14px] font-bold text-ink">Plan summary</p>
        <div className="mt-2 space-y-1.5 text-[13px]">
          <SummaryRow
            label="Total budget"
            from={formatMoneyShort(budget.limit)}
            to={formatMoneyShort(limitNum)}
            changed={limitDelta !== 0}
          />
          <SummaryRow
            label="Alert at"
            from={formatMoneyShort(budget.warningThreshold)}
            to={formatMoneyShort(warningNum)}
            changed={warningDelta !== 0}
          />
          <p className={`font-semibold ${remaining < 0 ? 'text-red' : 'text-green'}`}>
            {remaining < 0
              ? `Over-allocated by ${formatMoneyShort(Math.abs(remaining))}`
              : `${formatMoneyShort(remaining)} unallocated`}
          </p>
          {adjustedCategories > 0 && (
            <p className="text-muted">
              {adjustedCategories} categor{adjustedCategories === 1 ? 'y' : 'ies'} changed
            </p>
          )}
        </div>
      </Card>

      {error && (
        <p className="mt-3 rounded-input bg-redSoft px-4 py-2 text-[14px] font-semibold text-red">{error}</p>
      )}

      <ActionButton className="mt-4" leftIcon={<ArrowRight size={18} />} onClick={apply}>
        Apply to {nextMonthLabel.split(' ')[0]}
      </ActionButton>

      <button
        type="button"
        onClick={() => navigate('/budget-setup', withFrom('/budget-next-month'))}
        className="mt-3 w-full py-2 text-center text-[14px] font-semibold text-muted active:text-ink"
      >
        Edit budget period &amp; alerts
      </button>
    </AppShell>
  )
}

function distributeRemainder(alloc: Record<string, number>, target: number, ids: string[]) {
  const total = ids.reduce((sum, id) => sum + (alloc[id] ?? 0), 0)
  let diff = target - total
  if (diff === 0 || ids.length === 0) return

  const ranked = [...ids].sort((a, b) => (alloc[b] ?? 0) - (alloc[a] ?? 0))
  let i = 0
  let guard = 0
  while (diff !== 0 && guard < ranked.length * Math.abs(diff) + 10) {
    const id = ranked[i % ranked.length]
    const step = diff > 0 ? 1 : -1
    if ((alloc[id] ?? 0) + step >= 0) {
      alloc[id] = (alloc[id] ?? 0) + step
      diff -= step
    }
    i += 1
    guard += 1
  }
}

function QuickChip({
  label,
  onClick,
  highlight,
}: {
  label: string
  onClick: () => void
  highlight?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12px] font-bold active:opacity-80 ${
        highlight ? 'bg-primarySoft text-primary' : 'bg-surfaceSoft text-ink'
      }`}
    >
      {label}
    </button>
  )
}

function SummaryRow({
  label,
  from,
  to,
  changed,
}: {
  label: string
  from: string
  to: string
  changed: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">
        {changed ? (
          <>
            <span className="text-muted line-through">{from}</span>
            <span className="mx-1.5 text-muted">→</span>
            {to}
          </>
        ) : (
          to
        )}
      </span>
    </div>
  )
}
