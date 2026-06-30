import { useEffect, useRef, useState } from 'react'
import { AnnotationProvider, AnnotationToolbar } from '@/components/dev/AnnotationLayer'
import { PageNavSidebar } from './PageNavSidebar'
import { appPages } from './pageManifest'
import { qaTools } from './tools'

export type Selection = { kind: 'app'; path: string } | { kind: 'tool'; key: string }

const DEFAULT_PATH = '/home'

/**
 * QA review studio. Embeds the real app (index.html) in a phone-sized iframe and
 * lays the studio chrome — page-nav rail, "current screen" header, red-pen
 * annotation overlay — around it. The app bundle is wholly unaware of any of this.
 *
 * The iframe stays mounted for the app's whole lifetime so its state survives nav;
 * selecting a page just sets the iframe's location.hash (same-origin). QA tool
 * views render in an absolute panel over the iframe rather than replacing it.
 */
export function QAShell() {
  const [selection, setSelection] = useState<Selection>({ kind: 'app', path: DEFAULT_PATH })
  const frameRef = useRef<HTMLIFrameElement>(null)

  // Drive the embedded app's route when an app page is selected.
  useEffect(() => {
    if (selection.kind !== 'app') return
    const frame = frameRef.current
    if (!frame?.contentWindow) return
    const target = '#' + selection.path
    if (frame.contentWindow.location.hash !== target) {
      frame.contentWindow.location.hash = target
    }
  }, [selection])

  const currentLabel =
    selection.kind === 'app'
      ? appPages.find((p) => p.path === selection.path)?.label ?? 'App'
      : qaTools.find((t) => t.key === selection.key)?.label ?? 'QA Tool'

  // Annotations are keyed per view (app path, or tool key) so marks stay put.
  const pageKey = selection.kind === 'app' ? selection.path : `tool:${selection.key}`
  const activeTool = selection.kind === 'tool' ? qaTools.find((t) => t.key === selection.key) : undefined

  return (
    <AnnotationProvider pageKey={pageKey}>
      <div className="flex min-h-[100dvh] bg-[#F8F7F3] text-ink">
        <PageNavSidebar
          selection={selection}
          onSelectApp={(path) => setSelection({ kind: 'app', path })}
          onSelectTool={(key) => setSelection({ kind: 'tool', key })}
        />

        <section className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <header className="hidden h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-5 min-[720px]:flex">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Current Screen</p>
              <h2 className="text-lg font-bold leading-tight text-ink">{currentLabel}</h2>
            </div>
            <AnnotationToolbar />
          </header>

          <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-[#efe2d2] p-0 min-[720px]:items-center min-[720px]:bg-[radial-gradient(circle,_#dad7cf_1px,_transparent_1px)] min-[720px]:bg-[length:18px_18px] min-[720px]:p-7">
            <div className="flex w-full flex-col items-center gap-3 min-[720px]:w-auto">
              <p className="hidden text-xs font-bold text-muted min-[720px]:block">390 × 844 mobile preview</p>
              <div className="relative h-[100dvh] w-full max-w-none overflow-hidden bg-bg shadow-ring min-[720px]:h-[844px] min-[720px]:max-h-[calc(100dvh-150px)] min-[720px]:w-[390px] min-[720px]:rounded-[40px] min-[720px]:border-[10px] min-[720px]:border-ink min-[720px]:shadow-[0_28px_80px_rgba(17,24,39,0.24)]">
                <iframe
                  ref={frameRef}
                  title="Budgii app preview"
                  src={`./index.html#${DEFAULT_PATH}`}
                  className="h-full w-full border-0"
                />
                {activeTool && <div className="absolute inset-0 overflow-auto bg-bg">{activeTool.element}</div>}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AnnotationProvider>
  )
}
