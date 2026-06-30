import { cn } from '@/utils/cn'
import { appPages } from './pageManifest'
import { qaTools } from './tools'
import type { Selection } from './QAShell'

type Props = {
  selection: Selection
  onSelectApp: (path: string) => void
  onSelectTool: (key: string) => void
}

type Item = { id: string; label: string; sub: string; active: boolean; onClick: () => void }

function NavSection({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{title}</p>
      <nav className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={cn(
              'flex min-h-[56px] w-full items-center gap-3 rounded-xl px-3 text-left transition-colors',
              item.active ? 'bg-primary font-semibold text-white shadow-soft' : 'text-ink hover:bg-black/5',
            )}
          >
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-[11px]', item.active ? 'bg-white/20' : 'bg-black/5')}>
              <span className="h-2.5 w-2.5 rounded-full bg-current" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{item.label}</span>
              <span className={cn('block truncate text-xs font-normal', item.active ? 'text-white/75' : 'text-muted')}>{item.sub}</span>
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export function PageNavSidebar({ selection, onSelectApp, onSelectTool }: Props) {
  const appItems: Item[] = appPages.map((p) => ({
    id: p.path,
    label: p.label,
    sub: p.description,
    active: selection.kind === 'app' && selection.path === p.path,
    onClick: () => onSelectApp(p.path),
  }))

  const toolItems: Item[] = qaTools.map((t) => ({
    id: t.key,
    label: t.label,
    sub: t.description,
    active: selection.kind === 'tool' && selection.key === t.key,
    onClick: () => onSelectTool(t.key),
  }))

  return (
    <aside className="no-scrollbar hidden h-[100dvh] w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface min-[720px]:flex">
      <div className="border-b border-line px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">AI UI Studio</p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight text-ink">QA Workspace</h1>
      </div>

      <div className="space-y-6 px-3 py-4">
        <div className="rounded-2xl bg-primarySoft p-3">
          <p className="text-sm font-bold text-primary">Budgii</p>
          <p className="mt-0.5 text-xs text-muted">App + QA Workspace</p>
        </div>

        <NavSection title="App Pages" items={appItems} />
        {toolItems.length > 0 && <NavSection title="QA Tools" items={toolItems} />}
      </div>
    </aside>
  )
}
