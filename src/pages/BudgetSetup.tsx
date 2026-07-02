import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Wallet, AlertTriangle, PieChart, Bell, BellRing, LineChart, ChevronDown } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { ActionButton } from '@/components/ui/ActionButton'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useStore } from '@/store/appStore'
import { statusColor } from '@/utils/budget'
import { formatMoneyShort } from '@/utils/money'
import type { BudgetPeriod } from '@/types'
import { useLookups } from '@/store/lookups'

export function BudgetSetup() {
  const navigate = useNavigate()
  const budget = useStore((s) => s.budget)
  const updateBudget = useStore((s) => s.updateBudget)
  const { categories } = useLookups()

  // Local string mirrors so fields can be typed freely (incl. empty / partial),
  // while every change is written straight to the store so other pages (Home,
  // Reports, the budget ring) react to the new numbers immediately.
  const [period, setPeriod] = useState<BudgetPeriod>(budget.period)
  const [limit, setLimit] = useState(budget.limit ? String(budget.limit) : '')
  const [warning, setWarning] = useState(budget.warningThreshold ? String(budget.warningThreshold) : '')
  const [allocations, setAllocations] = useState<Record<string, number>>(budget.categoryAllocations ?? {})
  const [warnNotif, setWarnNotif] = useState(budget.warningNotifications)
  const [overAlerts, setOverAlerts] = useState(budget.overBudgetAlerts)
  const [error, setError] = useState('')

  const limitNum = parseFloat(limit) || 0
  const warningNum = parseFloat(warning) || 0
  const allocated = Object.values(allocations).reduce((a, b) => a + b, 0)
  const remaining = limitNum - allocated

  function commitLimit(v: string) {
    const clean = v.replace(/[^0-9.]/g, '')
    setLimit(clean)
    updateBudget({ limit: parseFloat(clean) || 0 })
  }

  function commitWarning(v: string) {
    const clean = v.replace(/[^0-9.]/g, '')
    setWarning(clean)
    updateBudget({ warningThreshold: parseFloat(clean) || 0 })
  }

  function setAlloc(id: string, value: string) {
    const clean = parseFloat(value.replace(/[^0-9.]/g, '')) || 0
    setAllocations((prev) => {
      const next = { ...prev, [id]: clean }
      updateBudget({ categoryAllocations: next })
      return next
    })
  }

  function setPeriodLive(p: BudgetPeriod) {
    setPeriod(p)
    updateBudget({ period: p })
  }

  function save() {
    if (warningNum >= limitNum) {
      setError('Warning threshold must be less than the total budget.')
      return
    }
    if (allocated > limitNum) {
      setError('Category allocations exceed the total budget.')
      return
    }
    setError('')
    // Values are already persisted live; this just confirms + returns to reports.
    updateBudget({
      period,
      limit: limitNum,
      warningThreshold: warningNum,
      categoryAllocations: allocations,
      warningNotifications: warnNotif,
      overBudgetAlerts: overAlerts,
    })
    navigate('/reports')
  }

  return (
    <AppShell topBar={<TopBar title="Set Up Budget" showBack />}>
      {/* Budget period */}
      <Card className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-greenSoft">
          <CalendarClock size={22} className="text-green" />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-ink">Budget Period</p>
          <p className="text-[13px] text-muted">Choose how often your budget resets.</p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriodLive(e.target.value as BudgetPeriod)}
            className="appearance-none rounded-input border border-line bg-surface py-2 pl-3 pr-8 text-[15px] font-semibold text-primary outline-none"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-primary" />
        </div>
      </Card>

      {/* Total + warning */}
      <Card className="mt-3 divide-y divide-line/70 py-0">
        <AmountRow icon={<Wallet size={22} className="text-green" />} iconBg="#EAF8ED" title="Total Monthly Budget" sub="Set your total budget for this period." value={limit} placeholder="1000" onChange={commitLimit} />
        <AmountRow icon={<AlertTriangle size={22} className="text-orange" />} iconBg="#FFF2DF" title="Warning Threshold" sub="You'll be alerted when spending reaches this." value={warning} placeholder="800" onChange={commitWarning} />
      </Card>

      {/* Allocations */}
      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart size={20} className="text-green" />
            <div>
              <p className="text-[15px] font-bold text-ink">Allocate by Category</p>
              <p className="text-[12px] text-muted">Distribute your budget across categories.</p>
            </div>
          </div>
          <span className={`text-[13px] font-bold ${remaining < 0 ? 'text-red' : 'text-green'}`}>
            Remaining: {formatMoneyShort(remaining)}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line p-2">
              <div className="flex items-center gap-1.5">
                <CategoryIcon icon={c.icon} color={c.color} size={26} />
                <span className="truncate text-[12px] font-semibold text-ink">{c.name}</span>
              </div>
              <div className="mt-1.5 flex items-center rounded-lg bg-surfaceSoft px-2">
                <span className="text-[13px] text-muted">$</span>
                <input
                  inputMode="numeric"
                  value={allocations[c.id] ?? 0}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setAlloc(c.id, e.target.value)}
                  className="w-full bg-transparent py-1.5 text-[14px] font-bold text-primary outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Toggles */}
      <Card className="mt-3 space-y-2">
        <ToggleRow icon={<Bell size={18} className="text-green" />} title="Warning Notifications" description="Get notified when you reach your warning threshold." checked={warnNotif} onChange={(v) => { setWarnNotif(v); updateBudget({ warningNotifications: v }) }} />
        <div className="h-px bg-line/70" />
        <ToggleRow icon={<BellRing size={18} className="text-red" />} iconBg="#FEECEC" title="Over-Budget Alerts" description="Get notified when you exceed your budget." checked={overAlerts} onChange={(v) => { setOverAlerts(v); updateBudget({ overBudgetAlerts: v }) }} />
      </Card>

      {/* Live preview */}
      <Card className="mt-3">
        <div className="mb-3 flex items-center gap-2">
          <LineChart size={20} className="text-green" />
          <div>
            <p className="text-[15px] font-bold text-ink">Live Preview</p>
            <p className="text-[12px] text-muted">See how your progress changes.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <PreviewRing amount={limitNum * 0.45} limit={limitNum} color={statusColor.good} title="Under Budget" caption="On track!" />
          <PreviewRing amount={warningNum + 20} limit={limitNum} color={statusColor.warning} title="At Warning" caption="Approaching" />
          <PreviewRing amount={limitNum * 1.15} limit={limitNum} color={statusColor.over} title="Over Budget" caption="Over limit" />
        </div>
      </Card>

      <div className="mt-3 rounded-card bg-primarySoft p-3 text-[13px] leading-snug text-ink">
        When spending reaches your <span className="font-bold text-orange">warning threshold</span>, the ring turns{' '}
        <span className="font-bold text-orange">orange</span>. When it exceeds your budget, it turns{' '}
        <span className="font-bold text-red">red</span> and we'll ask if you'd like to increase this month's limit.
      </div>

      {error && <p className="mt-3 rounded-input bg-redSoft px-4 py-2 text-[14px] font-semibold text-red">{error}</p>}

      <ActionButton className="mt-4" onClick={save}>
        Save Budget
      </ActionButton>
    </AppShell>
  )
}

function AmountRow({
  icon,
  iconBg,
  title,
  sub,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  sub: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[15px] font-bold text-ink">{title}</p>
        <p className="text-[12px] text-muted">{sub}</p>
      </div>
      <div className="flex w-28 items-center rounded-input border border-line bg-surfaceSoft px-3">
        <span className="text-[15px] text-muted">$</span>
        <input
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent py-2.5 text-right text-[16px] font-bold text-primary outline-none placeholder:font-normal placeholder:text-muted/50"
        />
      </div>
    </div>
  )
}

function PreviewRing({ amount, limit, color, title, caption }: { amount: number; limit: number; color: string; title: string; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[11px] font-bold" style={{ color }}>{title}</p>
      <ProgressRing progress={limit > 0 ? amount / limit : 0} size={84} stroke={9} color={color}>
        <span className="text-[13px] font-extrabold text-ink">{formatMoneyShort(amount)}</span>
        <span className="text-[10px] text-muted">{limit > 0 ? Math.round((amount / limit) * 100) : 0}%</span>
      </ProgressRing>
      <p className="text-[11px] text-muted">{caption}</p>
    </div>
  )
}
