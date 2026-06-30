import { Bell, TrendingDown, AlertTriangle, Gift, Check } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

type Notification = {
  id: string
  type: 'price_drop' | 'budget_warning' | 'budget_exceeded' | 'deal_found'
  title: string
  description: string
  timestamp: string
  read: boolean
  icon: 'trending_down' | 'alert' | 'gift'
}

// Mock notifications
const NOTIFICATIONS: Notification[] = [
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
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length

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
                <p className="text-sm text-muted">Check your activity updates</p>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications list */}
        <div className="space-y-2">
          {NOTIFICATIONS.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'transition-colors',
                notif.read ? 'opacity-75' : 'bg-surfaceSoft',
              )}
            >
              <div className="flex items-start gap-3">
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
                {!notif.read && (
                  <div className="shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {NOTIFICATIONS.length === 0 && (
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
