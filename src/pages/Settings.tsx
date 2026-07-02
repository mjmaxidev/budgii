import { useNavigate } from 'react-router-dom'
import { withFrom } from '@/utils/navigation'
import {
  User, SlidersHorizontal, Wallet, TrendingUp, Repeat, Tags, Users,
  CalendarDays, BarChart3, Bell, ScanLine, Gift, Sparkles,
  Download, LifeBuoy, LogOut, Trash2, ChevronRight,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/appStore'

type Item = { icon: typeof User; label: string; to?: string; soon?: boolean; danger?: boolean; action?: () => void }

// avatar can be an emoji or an uploaded image stored as a data URL
const isImage = (a?: string) => !!a && /^(data:|https?:|\/)/.test(a)

export function Settings() {
  const navigate = useNavigate()
  const resetData = useStore((s) => s.resetData)
  const userProfile = useStore((s) => s.userProfile)

  const sections: { title: string; items: Item[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: SlidersHorizontal, label: 'App Preferences', to: '/preferences' },
      ],
    },
    {
      title: 'Money',
      items: [
        { icon: Wallet, label: 'Budget Setting', to: '/budget-setup' },
        { icon: TrendingUp, label: 'Income Tracking', to: '/income-tracking' },
        { icon: Repeat, label: 'Recurring Transactions', to: '/recurring-transactions' },
        { icon: Tags, label: 'Categories & Tags', to: '/categories-tags' },
      ],
    },
    {
      title: 'Insights',
      items: [
        { icon: CalendarDays, label: 'Monthly Summary', to: '/monthly-summary' },
        { icon: BarChart3, label: 'Budget Comparison', to: '/budget-comparison' },
        { icon: Bell, label: 'Spending Alerts', to: '/spending-alerts' },
      ],
    },
    {
      title: 'Family',
      items: [
        { icon: Users, label: 'Manage Family Members', to: '/family-members' },
      ],
    },
    {
      title: 'Receipts & Deals',
      items: [
        { icon: ScanLine, label: 'Scan a Receipt', to: '/scan-receipt' },
        { icon: Gift, label: 'Deal Watchlist', to: '/deal-watchlist' },
        { icon: Sparkles, label: "Today's Deal Report", to: '/todays-deal-report' },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: Download, label: 'Export Data', to: '/data-export' },
        { icon: Trash2, label: 'Reset Demo Data', action: () => resetData(), danger: true },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: LifeBuoy, label: 'Help Center', to: '/help' },
      ],
    },
  ]

  return (
    <AppShell showBottomNav topBar={<TopBar title="Settings" />}>
      {/* Profile header → account & profile settings */}
      <button onClick={() => navigate('/account-settings')} className="w-full text-left">
        <Card className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primarySoft text-2xl">
            {isImage(userProfile.avatar) ? (
              <img src={userProfile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              userProfile.avatar || '🧑'
            )}
          </div>
          <div className="flex-1">
            <p className="text-[17px] font-extrabold text-ink">{userProfile.name || 'Alex Johnson'}</p>
            <p className="text-[13px] text-muted">{userProfile.email || 'dev@mjproductions.app'}</p>
          </div>
          <ChevronRight size={20} className="text-muted" />
        </Card>
      </button>

      {sections.map((section) => (
        <div key={section.title} className="mt-5">
          <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wide text-muted">{section.title}</h2>
          <Card className="divide-y divide-line/70 px-4 py-0">
            {section.items.map((it) => {
              const Icon = it.icon
              return (
                <button
                  key={it.label}
                  onClick={() => (it.action ? it.action() : it.to ? navigate(it.to, withFrom('/settings')) : undefined)}
                  className="flex w-full items-center gap-3 py-3.5 text-left active:bg-surfaceSoft"
                >
                  <Icon size={20} className={it.danger ? 'text-red' : 'text-muted'} />
                  <span className={`flex-1 text-[15px] font-semibold ${it.danger ? 'text-red' : 'text-ink'}`}>{it.label}</span>
                  {it.soon && <span className="rounded-pill bg-line/50 px-2 py-0.5 text-[11px] font-bold text-muted">Later</span>}
                  <ChevronRight size={18} className="text-muted" />
                </button>
              )
            })}
          </Card>
        </div>
      ))}

      <button
        onClick={() => navigate('/login')}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-input border border-red/40 py-4 text-[16px] font-bold text-red active:bg-redSoft"
      >
        <LogOut size={20} /> Logout
      </button>

      <p className="mt-4 text-center text-[12px] text-muted">Budgii v1.0.0</p>
    </AppShell>
  )
}
