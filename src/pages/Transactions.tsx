import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ScanLine } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { TransactionRow } from '@/components/finance/TransactionRow'
import { ExpenseEditor } from '@/components/finance/ExpenseEditor'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { ActionButton } from '@/components/ui/ActionButton'
import { useStore } from '@/store/appStore'
import { formatDate } from '@/utils/dates'
import { withFrom } from '@/utils/navigation'

const PAGE_SIZE = 30

export function Transactions() {
  const navigate = useNavigate()
  const expenses = useStore((s) => s.expenses)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(
    () =>
      [...expenses]
        .filter((e) => e.merchant.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [expenses, query],
  )
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, expenses.length])

  // group by date label
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>()
    for (const e of visible) {
      const key = formatDate(e.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return Array.from(map.entries())
  }, [visible])

  return (
    <AppShell showBottomNav topBar={<TopBar title="Transactions" />}>
      <div className="flex items-center gap-2 rounded-input border border-line bg-surface px-4 min-h-[50px]">
        <Search size={18} className="text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search merchant"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted/70"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ActionButton
          size="md"
          leftIcon={<Plus size={18} />}
          onClick={() => navigate('/add-expense', withFrom('/transactions'))}
        >
          Add Expense
        </ActionButton>
        <ActionButton
          size="md"
          variant="green"
          leftIcon={<ScanLine size={18} />}
          onClick={() => navigate('/scan-receipt', withFrom('/transactions'))}
        >
          Scan Receipt
        </ActionButton>
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 px-1 text-[12px] font-semibold text-muted">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} transactions
        </p>
      )}

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="🧾"
            title="No transactions"
            description="Add your first expense or scan a receipt to get started."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {groups.map(([label, items]) => (
            <div key={label}>
              <p className="mb-1 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">{label}</p>
              <Card className="divide-y divide-line/70 px-4 py-0">
                {items.map((e) => (
                  <TransactionRow key={e.id} expense={e} showChips onClick={() => setEditingId(e.id)} />
                ))}
              </Card>
            </div>
          ))}
          {hasMore && (
            <ActionButton
              size="md"
              variant="greenOutline"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load More Transactions
            </ActionButton>
          )}
        </div>
      )}

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Edit Transaction">
        {editingId && <ExpenseEditor expenseId={editingId} onDone={() => setEditingId(null)} />}
      </Modal>
    </AppShell>
  )
}
