import { useEffect, useState } from 'react'
import { Bell, TrendingDown, AlertTriangle, Gift, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { isApiEnabled } from '@/api/config'
import { listNotifications } from '@/api/notifications'
import type { NotificationResponse } from '@/api/types'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const READ_KEY = 'budgii-notifications-read'

function loadReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
}

type Notification = {
  id: string
  type: 'price_drop' | 'budget_warning' | 'budget_exceeded' | 'deal_found'
  title: string
  description: string
  timestamp: string
  read: boolean
  icon: 'trending_down' | 'alert' | 'gift'
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'price_drop',
    title: 'Price Drop Alert',
    description: 'Sony WH-1000XM5 headphones dropped to $348 (was $400)',
    timestamp: '2 hours ago',
    read: false,
    icon: 'trending_down',
  },
  {
    id: '2',
    type: 'budget_warning',
    title: 'Budget Warning',
    description: 'Shopping category at 85% of budget ($170 of $200)',
    timestamp: '4 hours ago',
    read: false,
    icon: 'alert',
  },
  {
    id: '3',
    type: 'deal_found',
    title: 'New Deal Match',
    description: 'Groceries on sale - 20% off at your favorite store',
    timestamp: 'Yesterday',
    read: true,
    icon: 'gift',
  },
  {
    id: '4',
    type: 'price_drop',
    title: 'Price Drop Alert',
    description: 'Coffee maker down to $45 (saved $20)',
    timestamp: '2 days ago',
    read: true,
    icon: 'trending_down',
  },
  {
    id: '5',
    type: 'budget_exceeded',
    title: 'Budget Exceeded',
    description: 'Entertainment category exceeded budget by $25',
    timestamp: '3 days ago',
    read: true,
    icon: 'alert',
  },
]

function mapApiNotification(notification: NotificationResponse): Notification {
  return {
    id: notification.id,
    type: isKnownType(notification.type) ? notification.type : 'deal_found',
    title: notification.title,
    description: notification.description,
    timestamp: formatTimestamp(notification.timestamp),
    read: false,
    icon: isKnownIcon(notification.icon) ? notification.icon : 'gift',
  }
}

function isKnownType(value: string): value is Notification['type'] {
  return ['price_drop', 'budget_warning', 'budget_exceeded', 'deal_found'].includes(value)
}

function isKnownIcon(value: string): value is Notification['icon'] {
  return ['trending_down', 'alert', 'gift'].includes(value)
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60_000))
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

const getIconComponent = (icon: string) => {
  switch (icon) {
    case 'trending_down':
      return <TrendingDown size={20} className="text-green" />
    case 'alert':
      return <AlertTriangle size={20} className="text-orange" />
    case 'gift':
      return <Gift size={20} className="text-primary" />
    default:
      return <Bell size={20} className="text-muted" />
  }
}

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'price_drop':
      return 'bg-green/10 text-green'
    case 'budget_warning':
      return 'bg-orange/10 text-orange'
    case 'budget_exceeded':
      return 'bg-red/10 text-red'
    case 'deal_found':
      return 'bg-primary/10 text-primary'
    default:
      return 'bg-muted/10 text-muted'
  }
}

export function Notifications() {
  const householdId = useAuthStore((s) => s.householdId)
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)
  const [apiNotifications, setApiNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const apiOn = isApiEnabled()

  useEffect(() => {
    if (!apiOn || !householdId) return

    let cancelled = false
    setLoading(true)
    setError('')
    listNotifications(householdId)
      .then((response) => {
        if (!cancelled) {
          setApiNotifications(response.notifications.map(mapApiNotification))
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load notifications.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [apiOn, householdId])

  const notifications = apiOn ? apiNotifications : MOCK_NOTIFICATIONS
  const isRead = (n: Notification) => n.read || readIds.has(n.id)
  const unreadCount = notifications.filter((n) => !isRead(n)).length

  function markRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }

  function markAllRead() {
    const next = new Set(notifications.map((n) => n.id))
    saveReadIds(next)
    setReadIds(next)
  }

  return (
    <AppShell
      showBottomNav
      topBar={<TopBar title="Notifications" showBack />}
    >
      <div className="space-y-3 py-4">
        {/* Unread summary */}
        {unreadCount > 0 && (
          <Card className="bg-primarySoft/30 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-ink">{unreadCount} new notification{unreadCount > 1 ? 's' : ''}</p>
                <p className="text-sm text-muted">Tap a notification to mark it read</p>
              </div>
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-1.5 text-[12px] font-bold text-white active:opacity-80"
              >
                <Check size={13} /> Mark all read
              </button>
            </div>
          </Card>
        )}

        {error && (
          <Card className="border border-red/20 bg-red/5">
            <p className="text-[13px] font-semibold text-red">{error}</p>
          </Card>
        )}

        {loading && (
          <Card className="py-4 text-center">
            <p className="text-[14px] font-semibold text-muted">Loading notifications...</p>
          </Card>
        )}

        {/* Notifications list */}
        <div className="space-y-2">
          {notifications.map((notif) => {
            const read = isRead(notif)
            return (
              <Card
                key={notif.id}
                className={cn('transition-colors', read ? 'opacity-75' : 'bg-surfaceSoft')}
              >
                <button
                  onClick={() => markRead(notif.id)}
                  className="flex w-full items-start gap-3 text-left"
                  disabled={read}
                >
                  <div className="mt-1 shrink-0">{getIconComponent(notif.icon)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink">{notif.title}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', getTypeBadgeColor(notif.type))}>
                        {notif.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{notif.description}</p>
                    <p className="mt-2 text-xs text-muted">{notif.timestamp}</p>
                  </div>
                  {!read && <div className="shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />}
                </button>
              </Card>
            )
          })}
        </div>

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <Card className="py-8 text-center">
            <Bell size={32} className="mx-auto mb-3 text-muted/40" />
            <p className="text-muted">No notifications yet</p>
            <p className="text-xs text-muted/60">Price drops, budget alerts, and deals will appear here</p>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
