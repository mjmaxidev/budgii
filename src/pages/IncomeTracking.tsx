import { useEffect, useMemo, useState } from 'react'
import { Calendar, Check, ChevronLeft, ChevronRight, Pencil, Plus, Repeat, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { MoneyText } from '@/components/ui/MoneyText'
import { ColorPickerField } from '@/components/ui/ColorPickerField'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import {
  formatMonthYear,
  incomeInMonth,
  isCurrentMonth,
  monthIncomeTotal,
  sumIncomeItems,
  sumOngoingIncome,
} from '@/utils/income'
import { CHALK_COLOR_PRESETS } from '@/constants/chalkColors'

const SOURCE_COLORS = CHALK_COLOR_PRESETS

function defaultDateForMonth(year: number, month: number) {
  const now = new Date()
  if (year === now.getFullYear() && month === now.getMonth()) {
    return now.toISOString().slice(0, 10)
  }
  return new Date(year, month, 1).toISOString().slice(0, 10)
}

export function IncomeTracking() {
  const incomeItems = useStore((s) => s.incomeItems)
  const ongoingIncomes = useStore((s) => s.ongoingIncomes)
  const addIncomeItem = useStore((s) => s.addIncomeItem)
  const updateIncomeItem = useStore((s) => s.updateIncomeItem)
  const deleteIncomeItem = useStore((s) => s.deleteIncomeItem)
  const addIncomeSource = useStore((s) => s.addIncomeSource)
  const deleteIncomeSource = useStore((s) => s.deleteIncomeSource)
  const updateOngoingIncome = useStore((s) => s.updateOngoingIncome)
  const upsertOngoingIncome = useStore((s) => s.upsertOngoingIncome)
  const incomeMemberIds = useStore((s) => s.settings.incomeMemberIds ?? [])
  const addMemberToIncomePicker = useStore((s) => s.addMemberToIncomePicker)
  const removeMembersFromIncomePicker = useStore((s) => s.removeMembersFromIncomePicker)
  const { familyMembers, incomeSources, member, incomeSource } = useLookups()

  const [selectedMonth, setSelectedMonth] = useState(() => new Date())
  const viewYear = selectedMonth.getFullYear()
  const viewMonth = selectedMonth.getMonth()

  const visibleMembers = useMemo(
    () => familyMembers.filter((m) => incomeMemberIds.includes(m.id)),
    [familyMembers, incomeMemberIds],
  )
  const hiddenMembers = useMemo(
    () => familyMembers.filter((m) => !incomeMemberIds.includes(m.id)),
    [familyMembers, incomeMemberIds],
  )

  const monthItems = useMemo(
    () => incomeInMonth(incomeItems, viewYear, viewMonth),
    [incomeItems, viewYear, viewMonth],
  )
  const ongoingTotal = sumOngoingIncome(ongoingIncomes)
  const manualTotal = sumIncomeItems(monthItems)
  const monthTotal = monthIncomeTotal(incomeItems, ongoingIncomes, viewYear, viewMonth)

  const [showModal, setShowModal] = useState(false)
  const [isOngoing, setIsOngoing] = useState(false)
  const [editingOngoingId, setEditingOngoingId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => defaultDateForMonth(viewYear, viewMonth))
  const [sourceId, setSourceId] = useState(incomeSources[0]?.id ?? '')
  const [memberId, setMemberId] = useState<string | undefined>(
    () => familyMembers.find((m) => m.isDefault)?.id ?? familyMembers[0]?.id,
  )
  const [notes, setNotes] = useState('')
  const [ongoingEnabled, setOngoingEnabled] = useState(true)
  const [memberSalaryMode, setMemberSalaryMode] = useState(false)
  const [oneTimeFormOpen, setOneTimeFormOpen] = useState(false)
  const [editingMemberOneTimeId, setEditingMemberOneTimeId] = useState<string | null>(null)
  const [oneTimeAmount, setOneTimeAmount] = useState('')
  const [oneTimeSourceId, setOneTimeSourceId] = useState('')
  const [oneTimeDate, setOneTimeDate] = useState(() => defaultDateForMonth(viewYear, viewMonth))
  const [oneTimeNotes, setOneTimeNotes] = useState('')

  const [sourceEditMode, setSourceEditMode] = useState(false)
  const [sourcesToDelete, setSourcesToDelete] = useState<Set<string>>(new Set())
  const [confirmDeleteSources, setConfirmDeleteSources] = useState(false)
  const [sourceCreateOpen, setSourceCreateOpen] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceColor, setNewSourceColor] = useState(SOURCE_COLORS[0])

  const [memberEditMode, setMemberEditMode] = useState(false)
  const [membersToRemove, setMembersToRemove] = useState<Set<string>>(new Set())
  const [memberAddOpen, setMemberAddOpen] = useState(false)

  useEffect(() => {
    if (incomeSources.some((s) => s.id === sourceId)) return
    setSourceId(incomeSources[0]?.id ?? '')
  }, [incomeSources, sourceId])

  useEffect(() => {
    if (!memberId || visibleMembers.some((m) => m.id === memberId)) return
    setMemberId(visibleMembers.find((m) => m.isDefault)?.id ?? visibleMembers[0]?.id)
  }, [visibleMembers, memberId])

  const memberOneTimeItems = useMemo(
    () => (memberId ? monthItems.filter((i) => i.memberId === memberId) : []),
    [monthItems, memberId],
  )

  const modalOngoingAmount =
    memberSalaryMode && ongoingEnabled ? parseFloat(amount) || 0 : 0
  const modalOneTimeTotal = sumIncomeItems(memberOneTimeItems)
  const modalMemberTotal = modalOngoingAmount + modalOneTimeTotal

  function shiftMonth(delta: number) {
    setSelectedMonth((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  function resetForm() {
    setAmount('')
    setDate(defaultDateForMonth(viewYear, viewMonth))
    setSourceId(incomeSources[0]?.id ?? '')
    setMemberId(visibleMembers.find((m) => m.isDefault)?.id ?? visibleMembers[0]?.id)
    setNotes('')
    setIsOngoing(false)
    setEditingOngoingId(null)
    setEditingItemId(null)
    setOngoingEnabled(true)
    setSourceEditMode(false)
    setSourcesToDelete(new Set())
    setMemberEditMode(false)
    setMembersToRemove(new Set())
    setMemberSalaryMode(false)
    resetOneTimeForm()
  }

  function resetOneTimeForm() {
    setOneTimeFormOpen(false)
    setEditingMemberOneTimeId(null)
    setOneTimeAmount('')
    setOneTimeSourceId(incomeSources[0]?.id ?? '')
    setOneTimeDate(defaultDateForMonth(viewYear, viewMonth))
    setOneTimeNotes('')
  }

  function openAddOneTimeForm() {
    resetOneTimeForm()
    setOneTimeSourceId(
      incomeSources.find((s) => s.id !== sourceId)?.id ?? incomeSources[0]?.id ?? '',
    )
    setOneTimeFormOpen(true)
  }

  function openEditMemberOneTime(id: string) {
    const item = incomeItems.find((i) => i.id === id)
    if (!item) return
    setOneTimeFormOpen(true)
    setEditingMemberOneTimeId(id)
    setOneTimeAmount(String(item.amount))
    setOneTimeSourceId(item.sourceId)
    setOneTimeDate(item.date.slice(0, 10))
    setOneTimeNotes(item.notes ?? '')
  }

  function saveMemberOneTime() {
    if (!memberId || !oneTimeAmount.trim() || !oneTimeSourceId) return
    const parsed = parseFloat(oneTimeAmount) || 0
    if (editingMemberOneTimeId) {
      updateIncomeItem(editingMemberOneTimeId, {
        amount: parsed,
        sourceId: oneTimeSourceId,
        memberId,
        date: new Date(oneTimeDate).toISOString(),
        notes: oneTimeNotes || undefined,
      })
    } else {
      addIncomeItem({
        amount: parsed,
        sourceId: oneTimeSourceId,
        memberId,
        date: new Date(oneTimeDate).toISOString(),
        notes: oneTimeNotes || undefined,
      })
    }
    resetOneTimeForm()
  }

  const canSaveOneTime =
    oneTimeAmount.trim() !== '' && !!oneTimeSourceId && !!memberId

  function openAddModal(ongoing = false) {
    if (visibleMembers.length === 0) {
      setMemberAddOpen(true)
      return
    }
    resetForm()
    setIsOngoing(ongoing)
    setDate(defaultDateForMonth(viewYear, viewMonth))
    setShowModal(true)
  }

  function openEditOngoing(id: string) {
    const entry = ongoingIncomes.find((o) => o.id === id)
    if (!entry) return
    resetForm()
    setEditingOngoingId(id)
    setIsOngoing(true)
    setAmount(String(entry.amount))
    setSourceId(entry.sourceId)
    setMemberId(entry.memberId)
    setNotes(entry.notes ?? '')
    setOngoingEnabled(entry.enabled)
    setMemberSalaryMode(true)
    setShowModal(true)
  }

  function openEditItem(id: string) {
    const item = incomeItems.find((i) => i.id === id)
    if (!item) return
    resetForm()
    setEditingItemId(id)
    setIsOngoing(false)
    setAmount(String(item.amount))
    setSourceId(item.sourceId)
    setMemberId(item.memberId)
    setNotes(item.notes ?? '')
    setDate(item.date.slice(0, 10))
    setShowModal(true)
  }

  const canSave =
    amount.trim() !== '' &&
    !!sourceId &&
    !!memberId &&
    visibleMembers.some((m) => m.id === memberId)

  function save() {
    if (!canSave) return
    const parsed = parseFloat(amount) || 0
    if (isOngoing) {
      if (editingOngoingId) {
        updateOngoingIncome(editingOngoingId, {
          amount: parsed,
          sourceId,
          memberId,
          notes: notes || undefined,
          enabled: ongoingEnabled,
        })
      } else {
        upsertOngoingIncome({
          sourceId,
          amount: parsed,
          memberId,
          notes: notes || undefined,
        })
      }
    } else if (editingItemId) {
      updateIncomeItem(editingItemId, {
        amount: parsed,
        date: new Date(date).toISOString(),
        sourceId,
        memberId,
        notes: notes || undefined,
      })
    } else {
      addIncomeItem({
        amount: parsed,
        date: new Date(date).toISOString(),
        sourceId,
        memberId,
        notes: notes || undefined,
      })
    }
    resetForm()
    setShowModal(false)
  }

  function toggleSourceEdit() {
    setSourceEditMode((v) => {
      if (v) setSourcesToDelete(new Set())
      return !v
    })
  }

  function toggleSourceDelete(id: string) {
    setSourcesToDelete((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function doDeleteSources() {
    sourcesToDelete.forEach((id) => deleteIncomeSource(id))
    if (sourcesToDelete.has(sourceId)) {
      const next = incomeSources.find((s) => !sourcesToDelete.has(s.id))
      setSourceId(next?.id ?? '')
    }
    setSourcesToDelete(new Set())
    setConfirmDeleteSources(false)
    setSourceEditMode(false)
  }

  function createSource() {
    if (!newSourceName.trim()) return
    const id = addIncomeSource(newSourceName.trim(), newSourceColor)
    setSourceId(id)
    setNewSourceName('')
    setNewSourceColor(SOURCE_COLORS[0])
    setSourceCreateOpen(false)
  }

  function toggleMemberEdit() {
    setMemberEditMode((v) => {
      if (v) setMembersToRemove(new Set())
      return !v
    })
  }

  function toggleMemberRemove(id: string) {
    setMembersToRemove((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function doRemoveMembersFromPicker() {
    removeMembersFromIncomePicker([...membersToRemove])
    if (memberId && membersToRemove.has(memberId)) {
      const next = visibleMembers.find((m) => !membersToRemove.has(m.id))
      setMemberId(next?.id)
    }
    setMembersToRemove(new Set())
    setMemberEditMode(false)
  }

  function addHiddenMember(id: string) {
    addMemberToIncomePicker(id)
    setMemberId(id)
    setMemberAddOpen(false)
  }

  function salarySourceId() {
    return (
      incomeSources.find((s) => s.id === 'incsrc_salary' || s.name === 'Salary')?.id ??
      incomeSources[0]?.id ??
      ''
    )
  }

  function openMemberSalary(id: string) {
    const salaryId = salarySourceId()
    const existing =
      ongoingIncomes.find((o) => o.memberId === id && o.sourceId === salaryId) ??
      ongoingIncomes.find((o) => o.memberId === id)

    if (existing) {
      openEditOngoing(existing.id)
      return
    }

    resetForm()
    setMemberId(id)
    setIsOngoing(true)
    setSourceId(salaryId)
    setDate(defaultDateForMonth(viewYear, viewMonth))
    setMemberSalaryMode(true)
    setShowModal(true)
  }

  const selectedMember = memberId ? member(memberId) : undefined

  return (
    <AppShell topBar={<TopBar title="Income Tracking" showBack />}>
      {/* Month navigator */}
      <Card className="mt-3 flex items-center justify-between py-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-line/40"
          aria-label="Previous month"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <p className="text-[17px] font-bold text-ink">{formatMonthYear(viewYear, viewMonth)}</p>
          {isCurrentMonth(viewYear, viewMonth) && (
            <p className="text-[12px] font-semibold text-primary">This month</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-line/40"
          aria-label="Next month"
        >
          <ChevronRight size={22} />
        </button>
      </Card>

      {/* Month total */}
      <Card className="mt-3 flex flex-col items-center gap-2 bg-green/10 py-5">
        <span className="text-[14px] font-semibold text-muted">Income this month</span>
        <MoneyText amount={monthTotal} className="text-[40px] font-extrabold text-green" />
        <div className="mt-1 flex flex-wrap justify-center gap-3 text-[13px] text-muted">
          {ongoingTotal > 0 && (
            <span>
              Ongoing <span className="font-semibold text-ink">${ongoingTotal.toFixed(0)}</span>
            </span>
          )}
          {manualTotal > 0 && (
            <span>
              One-time <span className="font-semibold text-ink">${manualTotal.toFixed(0)}</span>
            </span>
          )}
        </div>
      </Card>

      {/* Ongoing income */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-bold text-ink">Ongoing income</h2>
          <button
            type="button"
            onClick={() => openAddModal(true)}
            className="text-[14px] font-bold text-primary"
          >
            + Add
          </button>
        </div>
        <p className="mb-2 px-1 text-[13px] text-muted">
          Stable salary that repeats every month — toggle off when it changes.
        </p>
        {ongoingIncomes.length === 0 ? (
          <Card className="py-6 text-center">
            <Repeat size={28} className="mx-auto mb-2 text-muted" />
            <p className="text-[14px] text-muted">No ongoing income yet</p>
            <button
              type="button"
              onClick={() => openAddModal(true)}
              className="mt-2 text-[14px] font-bold text-primary"
            >
              Set up salary
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {ongoingIncomes.map((entry) => {
              const src = incomeSource(entry.sourceId)
              const mem = member(entry.memberId)
              return (
                <Card key={entry.id} className={`py-3 ${!entry.enabled ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={entry.enabled}
                      onClick={() => updateOngoingIncome(entry.id, { enabled: !entry.enabled })}
                      className={`h-7 w-12 shrink-0 rounded-full transition-colors ${
                        entry.enabled ? 'bg-green' : 'bg-line/60'
                      }`}
                    >
                      <span
                        className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                          entry.enabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditOngoing(entry.id)}
                      className="min-w-0 flex-1 text-left active:opacity-70"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink">{src?.name ?? 'Income'}</span>
                        <div className="flex items-center gap-2">
                          <MoneyText amount={entry.amount} className="font-bold text-ink" />
                          <Pencil size={14} className="shrink-0 text-muted" />
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                        <span className="inline-flex items-center gap-1 rounded-pill bg-green/10 px-2 py-0.5 text-[12px] font-semibold text-green">
                          <Repeat size={11} /> Every month
                        </span>
                        {mem ? (
                          <span>
                            {mem.avatar} {mem.name}
                          </span>
                        ) : (
                          <span className="font-semibold text-red">No member — tap to fix</span>
                        )}
                      </div>
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* This month — one-time entries */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-bold text-ink">This month only</h2>
          <button
            type="button"
            onClick={() => openAddModal(false)}
            className="text-[14px] font-bold text-primary"
          >
            + Add
          </button>
        </div>
        <p className="mb-2 px-1 text-[13px] text-muted">
          Variable income — bonuses, freelance, or anything that changes month to month.
        </p>
        {monthItems.length === 0 ? (
          <Card className="py-6 text-center">
            <p className="text-[14px] text-muted">No one-time income for {formatMonthYear(viewYear, viewMonth)}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {monthItems.map((item) => {
              const src = incomeSource(item.sourceId)
              const incomeMember = member(item.memberId)
              return (
                <Card key={item.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => openEditItem(item.id)}
                    className="flex w-full items-center gap-3 text-left active:opacity-70"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: src?.color ?? '#9ECB8B' }}
                    >
                      {src?.name.slice(0, 2).toUpperCase() ?? '—'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink">{src?.name ?? 'Income'}</span>
                        <div className="flex items-center gap-2">
                          <MoneyText amount={item.amount} className="font-bold text-ink" />
                          <Pencil size={14} className="shrink-0 text-muted" />
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                        {incomeMember ? (
                          <span className="rounded-pill bg-primarySoft px-2 py-0.5 text-[12px] font-semibold text-primary">
                            {incomeMember.avatar} {incomeMember.name}
                          </span>
                        ) : (
                          <span className="rounded-pill bg-red/10 px-2 py-0.5 text-[12px] font-semibold text-red">
                            No member — tap to fix
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* By source — this month */}
      <div className="mt-5">
        <h2 className="mb-2 px-1 text-[15px] font-bold text-ink">By source</h2>
        <div className="grid grid-cols-2 gap-2">
          {incomeSources.map((src) => {
            const fromOngoing = ongoingIncomes
              .filter((o) => o.enabled && o.sourceId === src.id)
              .reduce((s, o) => s + o.amount, 0)
            const fromManual = monthItems
              .filter((i) => i.sourceId === src.id)
              .reduce((s, i) => s + i.amount, 0)
            return (
              <Card key={src.id} className="flex flex-col items-center gap-1 py-3">
                <span className="mb-0.5 h-2 w-2 rounded-full" style={{ backgroundColor: src.color }} />
                <span className="text-[12px] font-semibold text-muted">{src.name}</span>
                <MoneyText amount={fromOngoing + fromManual} className="text-[18px] font-bold text-ink" />
              </Card>
            )
          })}
        </div>
      </div>

      {visibleMembers.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 px-1 text-[15px] font-bold text-ink">By family member</h2>
          <div className="grid grid-cols-2 gap-2">
            {visibleMembers.map((m) => {
              const fromOngoing = ongoingIncomes
                .filter((o) => o.enabled && o.memberId === m.id)
                .reduce((s, o) => s + o.amount, 0)
              const fromManual = monthItems
                .filter((i) => i.memberId === m.id)
                .reduce((s, i) => s + i.amount, 0)
              return (
                <Card key={m.id} className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => openMemberSalary(m.id)}
                    className="flex w-full items-center gap-2 text-left active:opacity-70"
                  >
                    <span className="text-xl">{m.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{m.name}</p>
                      <MoneyText amount={fromOngoing + fromManual} className="text-[16px] font-bold text-green" />
                    </div>
                    <Pencil size={14} className="shrink-0 text-muted" />
                  </button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <ActionButton onClick={() => openAddModal(false)} className="mt-6">
        <Plus size={20} /> Add Income
      </ActionButton>

      <Modal
        open={showModal}
        onClose={() => {
          resetForm()
          setShowModal(false)
        }}
        title={
          editingOngoingId
            ? selectedMember
              ? `${selectedMember.name}'s salary`
              : 'Edit ongoing income'
            : editingItemId
              ? 'Edit income'
              : isOngoing && selectedMember
                ? `${selectedMember.name}'s salary`
                : isOngoing
                  ? 'Add ongoing income'
                  : 'Add income'
        }
      >
        <div className="space-y-4">
          {!editingOngoingId && !editingItemId && (
            <Card className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Repeat size={16} className="text-green" />
                  <span className="text-[14px] font-bold text-ink">Ongoing salary</span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">
                  Same every month — turn off for one-time entries
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isOngoing}
                onClick={() => setIsOngoing((v) => !v)}
                className={`h-7 w-12 shrink-0 rounded-full transition-colors ${
                  isOngoing ? 'bg-green' : 'bg-line/60'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isOngoing ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </Card>
          )}

          <div>
            <label className="mb-2 block text-[13px] font-bold text-ink">Amount</label>
            <div className="rounded-input border border-line bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className="text-[24px] font-extrabold text-muted">$</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  className="w-full bg-transparent text-[24px] font-extrabold text-ink placeholder:text-ink/40 outline-none"
                />
              </div>
              {editingOngoingId && (
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-line/50 pt-3">
                  <span className="text-[13px] font-semibold text-muted">Ongoing salary</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ongoingEnabled}
                    onClick={() => setOngoingEnabled((v) => !v)}
                    className={`h-7 w-12 shrink-0 rounded-full transition-colors ${
                      ongoingEnabled ? 'bg-green' : 'bg-line/60'
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${
                        ongoingEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isOngoing && (
            <div>
              <label className="mb-2 block text-[13px] font-bold text-ink">Date</label>
              <div className="flex items-center justify-between rounded-input border border-line bg-surface p-3">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-transparent text-ink outline-none"
                />
                <Calendar size={18} className="text-muted" />
              </div>
            </div>
          )}

          {/* Source */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-bold text-ink">Source</label>
              {incomeSources.length > 1 && (
                <button type="button" onClick={toggleSourceEdit} className="text-[14px] font-bold text-primary">
                  {sourceEditMode ? 'Done' : 'Edit'}
                </button>
              )}
            </div>
            {sourceEditMode && (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteSources(true)}
                  disabled={sourcesToDelete.size === 0}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-bold ${
                    sourcesToDelete.size > 0 ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-line/40 text-muted'
                  }`}
                >
                  <Trash2 size={14} />
                  Delete{sourcesToDelete.size > 0 ? ` (${sourcesToDelete.size})` : ''}
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {incomeSources.map((src) => {
                const marked = sourcesToDelete.has(src.id)
                const selected = sourceId === src.id
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => {
                      if (sourceEditMode) {
                        toggleSourceDelete(src.id)
                        return
                      }
                      setSourceId(src.id)
                    }}
                    className={`relative rounded-input border p-3 text-[14px] font-bold transition ${
                      sourceEditMode && marked
                        ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]'
                        : selected && !sourceEditMode
                          ? 'border-green bg-green/10 text-green'
                          : 'border-line bg-surface text-ink active:bg-line/40'
                    }`}
                  >
                    <span
                      className="mb-1.5 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: src.color }}
                    />
                    <br />
                    {src.name}
                    {sourceEditMode && (
                      <span
                        className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          marked ? 'border-[#DC2626] bg-[#DC2626] text-white' : 'border-line bg-surface'
                        }`}
                      >
                        {marked && <Check size={12} />}
                      </span>
                    )}
                  </button>
                )
              })}
              {!sourceEditMode && (
                <button
                  type="button"
                  onClick={() => setSourceCreateOpen(true)}
                  className="flex flex-col items-center justify-center gap-1 rounded-input border-2 border-dashed border-line bg-surfaceSoft p-3 text-[14px] font-bold text-primary active:bg-line/30"
                >
                  <Plus size={20} />
                  Add
                </button>
              )}
            </div>
          </div>

          {familyMembers.length > 0 && !memberSalaryMode && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[13px] font-bold text-ink">
                  Family member <span className="text-red">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {!memberEditMode && (
                    <button
                      type="button"
                      onClick={() => setMemberAddOpen(true)}
                      className="text-[14px] font-bold text-primary"
                    >
                      + Add
                    </button>
                  )}
                  {visibleMembers.length > 0 && (
                    <button type="button" onClick={toggleMemberEdit} className="text-[14px] font-bold text-primary">
                      {memberEditMode ? 'Done' : 'Edit'}
                    </button>
                  )}
                </div>
              </div>
              {memberEditMode && (
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    onClick={doRemoveMembersFromPicker}
                    disabled={membersToRemove.size === 0}
                    className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-bold ${
                      membersToRemove.size > 0 ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-line/40 text-muted'
                    }`}
                  >
                    <Trash2 size={14} />
                    Remove{membersToRemove.size > 0 ? ` (${membersToRemove.size})` : ''}
                  </button>
                </div>
              )}
              {visibleMembers.length === 0 ? (
                <Card className="py-4 text-center">
                  <p className="text-[14px] text-muted">Add a family member to record income</p>
                  <button
                    type="button"
                    onClick={() => setMemberAddOpen(true)}
                    className="mt-2 text-[14px] font-bold text-primary"
                  >
                    + Add family member
                  </button>
                </Card>
              ) : (
              <div className="grid grid-cols-2 gap-2">
                {visibleMembers.map((m) => {
                  const marked = membersToRemove.has(m.id)
                  const selected = memberId === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        if (memberEditMode) {
                          toggleMemberRemove(m.id)
                          return
                        }
                        setMemberId(m.id)
                      }}
                      className={`relative flex items-center gap-2 rounded-input border p-3 text-left text-[14px] font-bold transition ${
                        memberEditMode && marked
                          ? 'border-[#DC2626] bg-[#FEE2E2] text-[#DC2626]'
                          : selected && !memberEditMode
                            ? 'border-primary bg-primarySoft text-ink'
                            : 'border-line bg-surface text-ink active:bg-line/40'
                      }`}
                    >
                      <span className="text-xl">{m.avatar}</span>
                      <span className="truncate">{m.name}</span>
                      {memberEditMode && (
                        <span
                          className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            marked ? 'border-[#DC2626] bg-[#DC2626] text-white' : 'border-line bg-surface'
                          }`}
                        >
                          {marked && <Check size={12} />}
                        </span>
                      )}
                    </button>
                  )
                })}
                {!memberEditMode && (
                  <button
                    type="button"
                    onClick={() => setMemberAddOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 rounded-input border-2 border-dashed border-line bg-surfaceSoft p-3 text-[14px] font-bold text-primary active:bg-line/30"
                  >
                    <Plus size={20} />
                    Add
                  </button>
                )}
              </div>
              )}
              {!memberId && visibleMembers.length > 0 && !memberEditMode && (
                <p className="mt-2 text-[13px] font-semibold text-red">Select who earns this income</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-[13px] font-bold text-ink">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full rounded-input border border-line bg-surface px-3 py-2 text-[14px] text-ink placeholder:text-muted/70 outline-none"
            />
          </div>

          {memberSalaryMode && memberId && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-[13px] font-bold text-ink">
                  One-time income — {formatMonthYear(viewYear, viewMonth)}
                </label>
                {!oneTimeFormOpen && (
                  <button
                    type="button"
                    onClick={openAddOneTimeForm}
                    className="text-[14px] font-bold text-primary"
                  >
                    + Add
                  </button>
                )}
              </div>
              <p className="mb-2 text-[13px] text-muted">
                Bonuses, freelance, or anything extra on top of salary this month.
              </p>

              {oneTimeFormOpen && (
                <Card className="mb-2 space-y-3 border-primary/30 py-3">
                  <p className="text-[14px] font-bold text-ink">
                    {editingMemberOneTimeId ? 'Edit one-time income' : 'Add one-time income'}
                  </p>
                  <div className="flex items-center gap-2 rounded-input border border-line bg-surface p-3">
                    <span className="text-[20px] font-extrabold text-muted">$</span>
                    <input
                      inputMode="decimal"
                      value={oneTimeAmount}
                      onChange={(e) => setOneTimeAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="0.00"
                      className="w-full bg-transparent text-[20px] font-extrabold text-ink outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {incomeSources.map((src) => (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setOneTimeSourceId(src.id)}
                        className={`rounded-input border p-2 text-[13px] font-bold ${
                          oneTimeSourceId === src.id
                            ? 'border-green bg-green/10 text-green'
                            : 'border-line bg-surface text-ink'
                        }`}
                      >
                        {src.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded-input border border-line bg-surface p-3">
                    <input
                      type="date"
                      value={oneTimeDate}
                      onChange={(e) => setOneTimeDate(e.target.value)}
                      className="flex-1 bg-transparent text-[14px] text-ink outline-none"
                    />
                    <Calendar size={16} className="text-muted" />
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                      variant="ghost"
                      fullWidth
                      onClick={resetOneTimeForm}
                    >
                      Cancel
                    </ActionButton>
                    <ActionButton
                      variant="green"
                      fullWidth
                      onClick={saveMemberOneTime}
                      disabled={!canSaveOneTime}
                    >
                      {editingMemberOneTimeId ? 'Update' : 'Add'}
                    </ActionButton>
                  </div>
                </Card>
              )}

              {memberOneTimeItems.length === 0 && !oneTimeFormOpen ? (
                <Card className="py-5 text-center">
                  <p className="text-[14px] text-muted">No one-time income this month</p>
                  <button
                    type="button"
                    onClick={openAddOneTimeForm}
                    className="mt-2 text-[14px] font-bold text-primary"
                  >
                    + Add one-time income
                  </button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {memberOneTimeItems.map((item) => {
                    const src = incomeSource(item.sourceId)
                    return (
                      <Card key={item.id} className="py-3">
                        <button
                          type="button"
                          onClick={() => openEditMemberOneTime(item.id)}
                          className="flex w-full items-center gap-3 text-left active:opacity-70"
                        >
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: src?.color ?? '#9ECB8B' }}
                          >
                            {src?.name.slice(0, 2).toUpperCase() ?? '—'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-ink">{src?.name ?? 'Income'}</span>
                              <MoneyText amount={item.amount} className="font-bold text-ink" />
                            </div>
                            <p className="mt-0.5 text-[12px] text-muted">
                              {new Date(item.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Pencil size={14} className="shrink-0 text-muted" />
                        </button>
                      </Card>
                    )
                  })}
                </div>
              )}

              <Card className="mt-3 bg-green/10 py-4">
                <p className="mb-2 text-center text-[13px] font-semibold text-muted">
                  Total for {selectedMember?.name ?? 'member'} — {formatMonthYear(viewYear, viewMonth)}
                </p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px] text-muted">
                  {ongoingEnabled && modalOngoingAmount > 0 && (
                    <span>
                      Ongoing{' '}
                      <span className="font-semibold text-ink">${modalOngoingAmount.toFixed(0)}</span>
                    </span>
                  )}
                  {modalOneTimeTotal > 0 && (
                    <span>
                      One-time{' '}
                      <span className="font-semibold text-ink">${modalOneTimeTotal.toFixed(0)}</span>
                    </span>
                  )}
                </div>
                <MoneyText
                  amount={modalMemberTotal}
                  className="mt-1 text-center text-[28px] font-extrabold text-green"
                />
              </Card>
            </div>
          )}

          {editingItemId && (
            <button
              type="button"
              onClick={() => {
                deleteIncomeItem(editingItemId)
                resetForm()
                setShowModal(false)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-input border border-red/40 py-3 text-[14px] font-bold text-red"
            >
              <Trash2 size={16} /> Remove income
            </button>
          )}

          <div className="flex gap-2 pt-2">
            <ActionButton
              variant="ghost"
              fullWidth
              onClick={() => {
                resetForm()
                setShowModal(false)
              }}
            >
              Cancel
            </ActionButton>
            <ActionButton variant="green" fullWidth onClick={save} disabled={!canSave}>
              {editingItemId || editingOngoingId
                ? 'Save changes'
                : isOngoing
                  ? 'Save salary'
                  : 'Save income'}
            </ActionButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={sourceCreateOpen}
        onClose={() => setSourceCreateOpen(false)}
        title="Add Income Source"
        variant="center"
      >
        <input
          value={newSourceName}
          onChange={(e) => setNewSourceName(e.target.value)}
          placeholder="Source name"
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <div className="mt-4">
          <ColorPickerField
            value={newSourceColor}
            onChange={setNewSourceColor}
            presets={SOURCE_COLORS}
            label="Colour"
          />
        </div>
        <ActionButton onClick={createSource} className="mt-5" leftIcon={<Plus size={18} />}>
          Add Source
        </ActionButton>
      </Modal>

      <Modal
        open={memberAddOpen}
        onClose={() => setMemberAddOpen(false)}
        title="Add Family Member"
        variant="center"
      >
        <p className="mb-4 text-[14px] text-muted">
          Choose a household member to show on Income Tracking.
        </p>
        {hiddenMembers.length === 0 ? (
          <p className="text-center text-[14px] text-muted">All family members are already shown.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {hiddenMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => addHiddenMember(m.id)}
                className="flex items-center gap-2 rounded-input border border-line bg-surface p-3 text-left text-[14px] font-bold text-ink active:bg-surfaceSoft"
              >
                <span className="text-xl">{m.avatar}</span>
                <span className="truncate">{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDeleteSources}
        onClose={() => setConfirmDeleteSources(false)}
        variant="center"
        title={sourcesToDelete.size === 1 ? 'Delete source?' : 'Delete sources?'}
      >
        <p className="text-[14px] text-muted">
          Income entries using {sourcesToDelete.size === 1 ? 'this source' : 'these sources'} will be
          moved to another source.
        </p>
        <div className="mt-5 flex gap-3">
          <ActionButton variant="outline" className="flex-1" onClick={() => setConfirmDeleteSources(false)}>
            Cancel
          </ActionButton>
          <button
            type="button"
            onClick={doDeleteSources}
            className="flex-1 rounded-pill bg-[#DC2626] py-3 text-center text-[15px] font-bold text-white"
          >
            Delete
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}
