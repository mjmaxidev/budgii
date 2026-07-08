import { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Check,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { ActionButton } from '@/components/ui/ActionButton'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { CategoryCreateModal, CategoryAddTile } from '@/components/finance/CategoryCreateModal'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import { formatMoney } from '@/utils/money'
import { isApiEnabled } from '@/api/config'
import { evaluateSpendingAlerts } from '@/api/alerts'
import { useAuthStore } from '@/store/authStore'
import type { SpendingAlertEvaluation } from '@/api/types'
import type { SpendingAlert } from '@/types'

export function SpendingAlerts() {
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newThreshold, setNewThreshold] = useState('')
  const [newAlertType, setNewAlertType] = useState<'amount' | 'percentage'>('amount')
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>(
    'default',
  )
  const [error, setError] = useState('')
  const [catModal, setCatModal] = useState(false)
  const [catCreateModal, setCatCreateModal] = useState(false)

  const spendingAlerts = useStore((s) => s.spendingAlerts)
  const addSpendingAlert = useStore((s) => s.addSpendingAlert)
  const updateSpendingAlert = useStore((s) => s.updateSpendingAlert)
  const deleteSpendingAlert = useStore((s) => s.deleteSpendingAlert)
  const deleteCategory = useStore((s) => s.deleteCategory)
  const updateExpense = useStore((s) => s.updateExpense)
  const expenses = useStore((s) => s.expenses)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const householdId = useAuthStore((s) => s.householdId)
  const notificationsEnabled = settings.notificationsEnabled
  const { categories } = useLookups()
  const [evaluatedAlerts, setEvaluatedAlerts] = useState<SpendingAlertEvaluation[]>([])

  const [editMode, setEditMode] = useState(false)
  const [toDelete, setToDelete] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)

  const selectedCategory = categories.find((c) => c.id === newCategoryId)

  // items affected if the currently-selected categories are deleted
  const deleteUsage = expenses.filter((e) => toDelete.has(e.categoryId)).length
  const fallbackCat = categories.find((c) => !toDelete.has(c.id))

  function toggleEditMode() {
    setEditMode((v) => {
      if (v) setToDelete(new Set()) // leaving edit clears selection
      return !v
    })
  }

  function toggleToDelete(id: string) {
    setToDelete((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function doDeleteSelected() {
    toDelete.forEach((id) => {
      // reassign this category's expenses to a category that survives the delete
      if (fallbackCat) {
        expenses
          .filter((e) => e.categoryId === id)
          .forEach((e) => updateExpense(e.id, { categoryId: fallbackCat.id }))
      }
      deleteCategory(id)
      if (newCategoryId === id) setNewCategoryId('')
    })
    setToDelete(new Set())
    setConfirmDelete(false)
    setEditMode(false)
  }

  function openCategoryCreate() {
    setCatModal(false)
    setCatCreateModal(true)
  }

  function onCategoryCreated(id: string) {
    setNewCategoryId(id)
    setCatCreateModal(false)
  }

  // Check notification permissions on mount; sync the saved toggle with reality
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission !== 'granted' && settings.notificationsEnabled) {
        updateSettings({ notificationsEnabled: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isApiEnabled() || !householdId) return
    let cancelled = false
    evaluateSpendingAlerts(householdId)
      .then((result) => {
        if (!cancelled) setEvaluatedAlerts(result.alerts)
      })
      .catch(() => {
        if (!cancelled) setEvaluatedAlerts([])
      })
    return () => {
      cancelled = true
    }
  }, [householdId, spendingAlerts, expenses])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications.')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted')
      updateSettings({ notificationsEnabled: true })
      testNotification()
      return
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        if (permission === 'granted') {
          updateSettings({ notificationsEnabled: true })
          testNotification()
        }
      } catch (err) {
        setError('Failed to request notification permission.')
      }
    } else {
      setError('Notification permission was denied. Please enable it in your browser settings.')
    }
  }

  // Test notification
  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Budgii Alert Test', {
        body: 'This is a test notification for spending alerts.',
        icon: '📊',
        tag: 'budgii-test',
      })
    }
  }

  // Add new alert
  const handleAddAlert = () => {
    if (!newCategoryId) {
      setError('Please select a category.')
      return
    }

    const threshold = parseFloat(newThreshold) || 0
    if (threshold <= 0) {
      setError('Please enter a valid threshold amount.')
      return
    }

    // Check if alert already exists for this category and type
    const exists = spendingAlerts.some((a) => a.categoryId === newCategoryId && a.alertType === newAlertType)
    if (exists) {
      setError('An alert for this category and type already exists.')
      return
    }

    addSpendingAlert({
      categoryId: newCategoryId,
      threshold,
      alertType: newAlertType,
    })

    setNewCategoryId('')
    setNewThreshold('')
    setNewAlertType('amount')
    setError('')
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name ?? 'Unknown'
  }

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color ?? '#ccc'
  }

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.icon ?? '📁'
  }

  // Group alerts by category
  const alertsByCategory = categories.map((cat) => ({
    category: cat,
    alerts: spendingAlerts.filter((a) => a.categoryId === cat.id),
  }))
  const activeEvaluations = evaluatedAlerts.filter((alert) => alert.active)

  return (
    <AppShell showBottomNav topBar={<TopBar title="Spending Alerts" showBack />}>
      {error && (
        <Card className="border-red/30 bg-redSoft">
          <div className="flex gap-2">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-red" />
            <p className="text-[13px] font-semibold text-ink">{error}</p>
          </div>
        </Card>
      )}

      {activeEvaluations.length > 0 && (
        <Card className="mt-4 border-red/30 bg-redSoft p-4">
          <div className="flex gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red" />
            <div>
              <p className="text-[14px] font-extrabold text-ink">
                {activeEvaluations.length} alert {activeEvaluations.length === 1 ? 'is' : 'are'} firing
              </p>
              <div className="mt-2 space-y-1">
                {activeEvaluations.slice(0, 3).map((alert) => {
                  const cat = categories.find((category) => category.id === alert.category_id)
                  return (
                    <p key={alert.id} className="text-[12px] font-semibold text-red">
                      {cat?.name ?? 'Category'}: {formatMoney(alert.spent)} spent
                      {alert.alert_type === 'percentage' && alert.limit
                        ? ` of ${formatMoney(alert.limit)}`
                        : ` of ${formatMoney(alert.threshold)}`}
                    </p>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Notifications Section */}
      <div className="mt-4">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Notifications</h2>
        <Card className="space-y-3 p-4">
          <ToggleRow
            icon={<Bell size={20} />}
            title="Enable Notifications"
            description={
              notificationPermission === 'granted'
                ? 'Notifications are active'
                : 'Grant permission to receive alerts'
            }
            checked={notificationsEnabled}
            onChange={() => {
              if (!notificationsEnabled) {
                requestNotificationPermission()
              } else {
                updateSettings({ notificationsEnabled: false })
              }
            }}
            iconBg="#EAF8ED"
          />

          {notificationsEnabled && notificationPermission === 'granted' && (
            <div className="border-t border-line/40 pt-3">
              <button
                onClick={testNotification}
                className="w-full rounded-input bg-green/10 py-2 text-[14px] font-semibold text-green active:bg-green/20"
              >
                Send Test Notification
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Alert Types Section */}
      <div className="mt-4">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Alert Types</h2>
        <Card className="divide-y divide-line/70 px-4 py-0">
          <ToggleRow
            icon="💰"
            title="Fixed Amount Alerts"
            description="Alert when category hits a specific amount"
            checked={settings.alertTypeAmount}
            onChange={(v) => updateSettings({ alertTypeAmount: v })}
            iconBg="#FFE5CC"
          />
          <ToggleRow
            icon="📊"
            title="Budget Percentage Alerts"
            description="Alert when category reaches 80% of budget"
            checked={settings.alertTypePercentage}
            onChange={(v) => updateSettings({ alertTypePercentage: v })}
            iconBg="#E0F2FE"
          />
        </Card>
      </div>

      {/* Add New Alert */}
      <div className="mt-4">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">Add New Alert</h2>
        <Card className="space-y-3 p-4">
          {/* Category Selector — opens a picker sheet that scales to any number of categories */}
          <div>
            <label className="block text-[13px] font-semibold text-muted mb-2">Category</label>
            <button
              type="button"
              onClick={() => setCatModal(true)}
              className="flex w-full items-center justify-between rounded-input border border-line bg-surface px-4 py-3 active:bg-surfaceSoft"
            >
              <span className="flex items-center gap-2">
                {selectedCategory ? (
                  <>
                    <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size={28} />
                    <span className="text-[15px] font-semibold text-ink">{selectedCategory.name}</span>
                  </>
                ) : (
                  <span className="text-[15px] text-muted">Select a category</span>
                )}
              </span>
              <ChevronRight size={18} className="text-muted" />
            </button>
          </div>

          {/* Alert Type Selector */}
          <div>
            <label className="block text-[13px] font-semibold text-muted mb-2">Alert Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewAlertType('amount')}
                className={`flex-1 rounded-input px-3 py-2 text-[13px] font-semibold transition ${
                  newAlertType === 'amount'
                    ? 'bg-primary/20 text-ink ring-2 ring-primary'
                    : 'bg-line/30 text-ink active:bg-line/50'
                }`}
              >
                Fixed Amount
              </button>
              <button
                onClick={() => setNewAlertType('percentage')}
                className={`flex-1 rounded-input px-3 py-2 text-[13px] font-semibold transition ${
                  newAlertType === 'percentage'
                    ? 'bg-primary/20 text-ink ring-2 ring-primary'
                    : 'bg-line/30 text-ink active:bg-line/50'
                }`}
              >
                Budget %
              </button>
            </div>
          </div>

          {/* Threshold Input */}
          <div>
            <label className="block text-[13px] font-semibold text-muted mb-2">
              {newAlertType === 'amount' ? 'Amount ($)' : 'Percentage (%)'}
            </label>
            <input
              type="number"
              placeholder={newAlertType === 'amount' ? 'e.g., 150' : 'e.g., 80'}
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              className="w-full rounded-input border border-line bg-surface px-4 py-2.5 text-[15px] text-ink placeholder:text-muted"
            />
          </div>

          <ActionButton leftIcon={<Plus size={20} />} onClick={handleAddAlert} variant="green" size="md">
            Add Alert
          </ActionButton>
        </Card>
      </div>

      {/* Existing Alerts */}
      <div className="mt-4 mb-6">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Active Alerts ({spendingAlerts.length})
        </h2>

        {spendingAlerts.length === 0 ? (
          <Card className="border-line/50 bg-surface/50 text-center py-6">
            <Bell size={32} className="mx-auto mb-2 text-muted/40" />
            <p className="text-[14px] font-semibold text-muted">No alerts yet</p>
            <p className="text-[12px] text-muted">Create one to get started with spending alerts.</p>
          </Card>
        ) : (
          alertsByCategory
            .filter((group) => group.alerts.length > 0)
            .map((group) => (
              <div key={group.category.id} className="mb-3">
                <div className="mb-1 flex items-center gap-2 px-1">
                  <span className="text-lg">{group.category.icon}</span>
                  <span className="text-[14px] font-bold text-ink">{group.category.name}</span>
                </div>
                <Card className="divide-y divide-line/40 space-y-0 p-0">
                  {group.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-3 border-l-4 px-4 py-3"
                      style={{ borderLeftColor: group.category.color }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {alert.alertType === 'amount' ? (
                            <span className="text-[13px] font-semibold text-ink">
                              💰 {formatMoney(alert.threshold)}
                            </span>
                          ) : (
                            <span className="text-[13px] font-semibold text-ink">📊 {alert.threshold}%</span>
                          )}
                          <span className="rounded-pill bg-greenSoft px-2 py-0.5 text-[11px] font-bold text-green">
                            Active
                          </span>
                        </div>
                        <p className="text-[12px] text-muted mt-0.5">
                          {alert.alertType === 'amount'
                            ? `Alert when spending reaches ${formatMoney(alert.threshold)}`
                            : 'Alert at 80% of budget'}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteSpendingAlert(alert.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red/10 text-red active:bg-red/20 transition"
                        title="Delete alert"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </Card>
              </div>
            ))
        )}
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-primary/30 bg-primarySoft">
        <div className="flex gap-3">
          <AlertTriangle size={20} className="shrink-0 text-primary" />
          <div>
            <p className="text-[13px] font-bold text-ink">How alerts work</p>
            <p className="text-[12px] leading-snug text-muted mt-1">
              Fixed amount alerts trigger when you spend that amount in a category. Budget percentage alerts
              trigger at 80% of the category's allocated budget.
            </p>
          </div>
        </div>
      </Card>

      {/* Category picker sheet — scrolls for any number of categories, with inline create */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Choose Category">
        {/* Edit / multi-select toolbar */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] text-muted">
            {editMode ? 'Select categories to delete' : 'Tap to choose'}
          </p>
          <div className="flex items-center gap-3">
            {editMode && (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={toDelete.size === 0}
                className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-bold transition ${
                  toDelete.size > 0
                    ? 'bg-[#FEE2E2] text-[#DC2626] active:bg-[#FBCFCF]'
                    : 'bg-line/40 text-muted'
                }`}
              >
                <Trash2 size={14} />
                Delete{toDelete.size > 0 ? ` (${toDelete.size})` : ''}
              </button>
            )}
            {categories.length > 1 && (
              <button onClick={toggleEditMode} className="text-[14px] font-bold text-primary">
                {editMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-1">
          {categories.map((c) => {
            const isSelected = newCategoryId === c.id
            const hasAlert = spendingAlerts.some((a) => a.categoryId === c.id)
            const marked = toDelete.has(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  if (editMode) {
                    toggleToDelete(c.id)
                    return
                  }
                  if (hasAlert && !isSelected) return // already has an alert — not selectable
                  setNewCategoryId(c.id)
                  setCatModal(false)
                }}
                className={`relative flex flex-col items-center gap-1.5 rounded-card border p-3 transition ${
                  editMode && marked
                    ? 'border-[#DC2626] bg-[#FEE2E2]'
                    : isSelected
                      ? 'border-primary bg-primarySoft'
                      : !editMode && hasAlert
                        ? 'cursor-not-allowed border-line bg-line/20 opacity-50'
                        : 'border-line bg-surface active:bg-surfaceSoft'
                }`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={40} />
                <span className="truncate text-[12px] font-semibold text-ink">{c.name}</span>
                {!editMode && hasAlert && !isSelected && (
                  <span className="absolute right-1 top-1 text-[9px] font-bold uppercase text-muted">
                    set
                  </span>
                )}
                {editMode && (
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
          {!editMode && <CategoryAddTile onClick={openCategoryCreate} />}
        </div>
      </Modal>

      <CategoryCreateModal
        open={catCreateModal}
        onClose={() => {
          setCatCreateModal(false)
          setCatModal(true)
        }}
        onSaved={onCategoryCreated}
      />

      {/* Delete categories confirmation */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        variant="center"
        title={toDelete.size === 1 ? 'Delete category?' : 'Delete categories?'}
      >
        <p className="text-[14px] text-muted">
          You're about to delete{' '}
          <span className="font-semibold text-ink">
            {toDelete.size} {toDelete.size === 1 ? 'category' : 'categories'}
          </span>
          .{' '}
          {deleteUsage > 0 ? (
            <>
              <span className="font-semibold text-ink">
                {deleteUsage} {deleteUsage === 1 ? 'item is' : 'items are'} currently using{' '}
                {toDelete.size === 1 ? 'it' : 'them'}.
              </span>{' '}
              {fallbackCat ? <>Those items will be moved to “{fallbackCat.name}”. </> : null}
            </>
          ) : (
            <>No items are using {toDelete.size === 1 ? 'it' : 'them'}. </>
          )}
          This can't be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <ActionButton variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
            Cancel
          </ActionButton>
          <button
            onClick={doDeleteSelected}
            className="flex-1 rounded-pill bg-[#DC2626] py-3 text-center text-[15px] font-bold text-white active:bg-[#B91C1C]"
          >
            Delete
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}
