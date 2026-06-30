import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SlidersHorizontal, Calendar, TrendingUp, User } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { CategoryBreakdownRow } from '@/components/finance/CategoryBreakdownRow'
import { CarouselCard } from '@/components/finance/CarouselCard'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { MoneyText } from '@/components/ui/MoneyText'
import { useStore } from '@/store/appStore'
import {
  breakdownByCategory,
  breakdownByMember,
  breakdownByTag,
  expensesInPeriod,
  sumExpenses,
} from '@/store/selectors'
import { monthLabel } from '@/utils/dates'
import type { Period } from '@/types'
import { useLookups } from '@/store/lookups'

const tagColors = ['#16A34A', '#9B5DE5', '#FB8500', '#2386F6', '#EF4444']
const cardBgs = ['#EAF8ED', '#F2E8FF', '#FFF7D6', '#EAF4FF', '#FEECEC']

export function SpendingBreakdown() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>('monthly')
  const expenses = useStore((s) => s.expenses)
  const { category, tag, member } = useLookups()

  const periodExpenses = expensesInPeriod(expenses, period)
  const total = sumExpenses(periodExpenses)
  const cats = breakdownByCategory(periodExpenses)
  const tagsB = breakdownByTag(periodExpenses)
  const membersB = breakdownByMember(periodExpenses)
  const details = [...periodExpenses].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 6)

  return (
    <AppShell
      topBar={
        <TopBar
          title="Spending Breakdown"
          showBack
          right={
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-ink active:bg-line/40">
              <SlidersHorizontal size={20} />
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

      {/* Summary */}
      <Card className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primarySoft">
          <Calendar size={24} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-extrabold text-ink">
            {period === 'monthly' ? monthLabel(new Date().toISOString()) : period === 'weekly' ? 'This Week' : 'Today'}
          </p>
          <p className="text-[13px] text-muted">Total Spent</p>
          <MoneyText amount={total} cents={false} className="text-[26px] font-extrabold text-ink" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-greenSoft">
            <TrendingUp size={20} className="text-green" />
          </div>
          <span className="text-[12px] text-muted">{periodExpenses.length} txns</span>
        </div>
      </Card>

      {/* By Category */}
      <SectionHeader title="By Category" />
      <Card className="mt-2 divide-y divide-line/70 px-4 py-0">
        {cats.map((c) => {
          const cat = category(c.id)
          if (!cat) return null
          return (
            <CategoryBreakdownRow
              key={c.id}
              icon={cat.icon}
              color={cat.color}
              name={cat.name}
              amount={c.total}
              percent={c.percent}
            />
          )
        })}
        {cats.length === 0 && <p className="py-6 text-center text-muted">No data.</p>}
      </Card>

      {/* By Tags carousel */}
      <SectionHeader title="By Tags" />
      <div className="no-scrollbar mt-2 flex gap-3 overflow-x-auto pb-1">
        {tagsB.map((t, i) => {
          const tg = tag(t.id)
          return (
            <CarouselCard
              key={t.id}
              top={<User size={20} style={{ color: tagColors[i % tagColors.length] }} />}
              label={tg?.name ?? 'Untagged'}
              amount={t.total}
              percent={t.percent}
              percentColor={tagColors[i % tagColors.length]}
              bg={cardBgs[i % cardBgs.length]}
            />
          )
        })}
      </div>

      {/* By Members carousel */}
      <SectionHeader title="By Members" />
      <div className="no-scrollbar mt-2 flex gap-3 overflow-x-auto pb-1">
        {membersB.map((m, i) => {
          const mem = member(m.id)
          return (
            <CarouselCard
              key={m.id}
              top={<span className="text-2xl">{mem?.avatar ?? '👤'}</span>}
              label={mem?.name ?? 'Unassigned'}
              amount={m.total}
              percent={m.percent}
              percentColor={tagColors[i % tagColors.length]}
            />
          )
        })}
      </div>

      {/* This Month Details */}
      <SectionHeader title="This Month Details" />
      <Card className="mt-2 divide-y divide-line/70 px-4 py-0">
        {details.map((e) => (
          <TransactionRow key={e.id} expense={e} showChips onClick={() => navigate('/transactions')} />
        ))}
      </Card>
    </AppShell>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <h2 className="text-[18px] font-extrabold text-ink">{title}</h2>
      <button className="text-[14px] font-bold text-green">View All</button>
    </div>
  )
}
