import { Home, ListChecks, PieChart, Settings as SettingsIcon, Plus } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

const items = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: ListChecks },
  { to: '/reports', label: 'Reports', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function BottomNav() {
  const navigate = useNavigate()
  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-line bg-surface/95 backdrop-blur">
      <div className="relative flex items-end justify-between px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
        {items.slice(0, 2).map((it) => (
          <NavItem key={it.to} {...it} />
        ))}
        <div className="flex w-16 justify-center">
          <button
            onClick={() => navigate('/add-expense-choice')}
            aria-label="Add expense"
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-ring active:scale-95"
          >
            <Plus size={28} />
          </button>
        </div>
        {items.slice(2).map((it) => (
          <NavItem key={it.to} {...it} />
        ))}
      </div>
    </nav>
  )
}

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex w-16 flex-col items-center gap-1 py-1 text-[11px] font-medium transition',
          isActive ? 'text-primary' : 'text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} className={isActive ? 'text-primary' : 'text-muted'} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}
