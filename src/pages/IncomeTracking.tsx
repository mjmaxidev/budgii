import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Plus } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { MoneyText } from '@/components/ui/MoneyText'
import { useStore } from '@/store/appStore'
import type { IncomeItem } from '@/types'

const INCOME_SOURCES: IncomeItem['source'][] = ['Salary', 'Freelance', 'Investment', 'Other']
const SOURCE_COLORS: Record<IncomeItem['source'], string> = {
  Salary: '#2386F6',
  Freelance: '#16A34A',
  Investment: '#9B5DE5',
  Other: '#F59E0B',
}

export function IncomeTracking() {
  const navigate = useNavigate()
  const incomeItems = useStore((s) => s.incomeItems)
  const addIncomeItem = useStore((s) => s.addIncomeItem)

  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [source, setSource] = useState<IncomeItem['source']>('Salary')
  const [notes, setNotes] = useState('')

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0)

  function save() {
    if (!amount.trim()) return
    addIncomeItem({
      amount: parseFloat(amount) || 0,
      date: new Date(date).toISOString(),
      source,
      notes: notes || undefined,
    })
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setSource('Salary')
    setNotes('')
    setShowModal(false)
  }

  return (
    <AppShell topBar={<TopBar title="Income Tracking" showBack />}>
      {/* Total Income */}
      <Card className="mt-3 flex flex-col items-center justify-center gap-2 bg-green/10 py-6">
        <span className="text-[14px] font-semibold text-muted">Total Income</span>
        <MoneyText amount={totalIncome} className="text-[42px] font-extrabold text-green" />
      </Card>

      {/* Income Sources Summary */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {INCOME_SOURCES.map((src) => {
          const sourceTotal = incomeItems
            .filter((item) => item.source === src)
            .reduce((sum, item) => sum + item.amount, 0)
          return (
            <Card key={src} className="flex flex-col items-center justify-center gap-1.5 py-4">
              <span className="text-[13px] font-semibold text-muted">{src}</span>
              <MoneyText
                amount={sourceTotal}
                className="text-[20px] font-bold text-ink"
              />
            </Card>
          )
        })}
      </div>

      {/* Income List */}
      <div className="mt-4 space-y-2">
        <h2 className="px-1 text-[15px] font-bold text-ink">Recent Income</h2>
        {incomeItems.length === 0 ? (
          <Card className="py-8 text-center">
            <p className="text-[15px] text-muted">No income entries yet</p>
          </Card>
        ) : (
          incomeItems.map((item) => (
            <Card key={item.id} className="py-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-full"
                  style={{ backgroundColor: SOURCE_COLORS[item.source] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-ink">{item.source}</span>
                    <MoneyText amount={item.amount} className="font-bold text-ink" />
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-muted">
                    <Calendar size={12} />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  {item.notes && (
                    <p className="mt-1 text-[13px] text-muted">{item.notes}</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ActionButton onClick={() => setShowModal(true)} className="mt-6">
        <Plus size={20} /> Add Income
      </ActionButton>

      {/* Add Income Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Income">
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-[13px] font-bold text-ink mb-2">Amount</label>
            <div className="flex items-center gap-2 rounded-input border border-line bg-surface p-3">
              <span className="text-[24px] font-extrabold text-muted">$</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="w-full bg-transparent text-[24px] font-extrabold text-ink placeholder:text-ink/40 outline-none"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[13px] font-bold text-ink mb-2">Date</label>
            <div className="flex items-center justify-between rounded-input border border-line bg-surface p-3">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-transparent outline-none text-ink"
              />
              <Calendar size={18} className="text-muted" />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-[13px] font-bold text-ink mb-2">Source</label>
            <div className="grid grid-cols-2 gap-2">
              {INCOME_SOURCES.map((src) => (
                <button
                  key={src}
                  onClick={() => setSource(src)}
                  className={`rounded-input border p-3 text-[14px] font-bold transition ${
                    source === src
                      ? 'border-green bg-green/10 text-green'
                      : 'border-line bg-surface text-ink active:bg-line/40'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[13px] font-bold text-ink mb-2">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full rounded-input border border-line bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-muted/70 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <ActionButton variant="ghost" fullWidth onClick={() => setShowModal(false)}>
              Cancel
            </ActionButton>
            <ActionButton variant="green" fullWidth onClick={save}>
              Save Income
            </ActionButton>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
