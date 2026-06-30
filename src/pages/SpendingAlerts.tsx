import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { ActionButton } from '@/components/ui/ActionButton'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useStore } from '@/store/appStore'
import { useLookups } from '@/store/lookups'
import { formatMoney } from '@/utils/money'
import type { SpendingAlert } from '@/types'

export function SpendingAlerts() {
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newThreshold, setNewThreshold] = useState('')
  const [newAlertType, setNewAlertType] = useState<'amount' | 'percentage'>('amount')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default')
  const [categoryAlertTypes, setCategoryAlertTypes] = useState<Record<string, boolean>>({
    amount: true,
    percentage: true,
  })
  const [error, setError] = useState('')

  const spendingAlerts = useStore((s) => s.spendingAlerts)
  const addSpendingAlert = useStore((s) => s.addSpendingAlert)
  const updateSpendingAlert = useStore((s) => s.updateSpendingAlert)
  const deleteSpendingAlert = useStore((s) => s.deleteSpendingAlert)
  const { categories } = useLookups()

  // Check notification permissions on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications.')
      return
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted')
      setNotificationsEnabled(true)
      testNotification()
      return
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        if (permission === 'granted') {
          setNotificationsEnabled(true)
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
    const exists = spendingAlerts.some(
      (a) => a.categoryId === newCategoryId && a.alertType === newAlertType,
    )
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

  // Toggle alert type
  const toggleAlertType = (type: 'amount' | 'percentage') => {
    setCategoryAlertTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
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

      {/* Notifications Section */}
      <div className="mt-4">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Notifications
        </h2>
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
                setNotificationsEnabled(false)
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
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Alert Types
        </h2>
        <Card className="divide-y divide-line/70 px-4 py-0">
          <ToggleRow
            icon="💰"
            title="Fixed Amount Alerts"
            description="Alert when category hits a specific amount"
            checked={categoryAlertTypes.amount}
            onChange={() => toggleAlertType('amount')}
            iconBg="#FFE5CC"
          />
          <ToggleRow
            icon="📊"
            title="Budget Percentage Alerts"
            description="Alert when category reaches 80% of budget"
            checked={categoryAlertTypes.percentage}
            onChange={() => toggleAlertType('percentage')}
            iconBg="#E0F2FE"
          />
        </Card>
      </div>

      {/* Add New Alert */}
      <div className="mt-4">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">
          Add New Alert
        </h2>
        <Card className="space-y-3 p-4">
          {/* Category Selector */}
          <div>
            <label className="block text-[13px] font-semibold text-muted mb-2">Category</label>
            <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
              {categories.map((cat) => {
                const isSelected = newCategoryId === cat.id
                const hasAlert = spendingAlerts.some((a) => a.categoryId === cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setNewCategoryId(cat.id)}
                    disabled={hasAlert && !isSelected}
                    className={`rounded-input px-3 py-2 text-[13px] font-semibold transition ${
                      isSelected
                        ? 'bg-primary/20 text-ink ring-2 ring-primary'
                        : hasAlert
                          ? 'cursor-not-allowed bg-line/40 text-muted opacity-50'
                          : 'bg-line/30 text-ink active:bg-line/50'
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.name}
                  </button>
                )
              })}
            </div>
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

          <ActionButton
            leftIcon={<Plus size={20} />}
            onClick={handleAddAlert}
            variant="green"
            size="md"
          >
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
                            <span className="text-[13px] font-semibold text-ink">
                              📊 {alert.threshold}%
                            </span>
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
    </AppShell>
  )
}
