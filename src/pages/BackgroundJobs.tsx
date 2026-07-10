import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, RefreshCw, ServerCog } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { getBackgroundJobStatus } from '@/api/backgroundJobs'
import { isApiEnabled } from '@/api/config'
import type { BackgroundJobRunResponse } from '@/api/types'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const JOBS = [
  {
    name: 'recurring',
    title: 'Recurring Expenses',
    description: 'Applies due recurring expenses to household transactions.',
  },
  {
    name: 'push',
    title: 'Push Dispatch',
    description: 'Sends eligible budget, deal, and summary notifications.',
  },
]

export function BackgroundJobs() {
  const householdId = useAuthStore((s) => s.householdId)
  const [runs, setRuns] = useState<BackgroundJobRunResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const apiOn = isApiEnabled()

  const runsByName = useMemo(() => new Map(runs.map((run) => [run.job_name, run])), [runs])

  async function loadStatus() {
    if (!apiOn || !householdId || loading) return
    setLoading(true)
    setError('')
    try {
      const response = await getBackgroundJobStatus(householdId)
      setRuns(response.runs)
    } catch {
      setError('Could not load background job status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiOn, householdId])

  return (
    <AppShell showBottomNav topBar={<TopBar title="Background Jobs" showBack />}>
      <div className="mt-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-extrabold text-ink">Worker Status</h2>
            <p className="mt-1 text-[13px] leading-snug text-muted">
              Last successful or failed server runs for scheduled Budgii tasks.
            </p>
          </div>
          <button
            onClick={() => {
              void loadStatus()
            }}
            disabled={!apiOn || !householdId || loading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white disabled:bg-primary/40"
            aria-label="Refresh background job status"
          >
            <RefreshCw size={19} className={cn(loading && 'animate-spin')} />
          </button>
        </div>

        {!apiOn && (
          <Card className="border-orange/30 bg-orange/10">
            <p className="text-[14px] font-semibold text-ink">API mode is off.</p>
            <p className="mt-1 text-[13px] text-muted">Worker status is only available from the backend.</p>
          </Card>
        )}

        {error && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">{error}</p>
        )}

        {JOBS.map((job) => (
          <JobStatusCard key={job.name} job={job} run={runsByName.get(job.name)} loading={loading} />
        ))}
      </div>
    </AppShell>
  )
}

function JobStatusCard({
  job,
  run,
  loading,
}: {
  job: (typeof JOBS)[number]
  run?: BackgroundJobRunResponse
  loading: boolean
}) {
  const failed = run?.status === 'failed'
  const succeeded = run?.status === 'success'

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            failed
              ? 'bg-redSoft text-red'
              : succeeded
                ? 'bg-greenSoft text-green'
                : 'bg-surfaceSoft text-muted',
          )}
        >
          {failed ? (
            <AlertTriangle size={21} />
          ) : succeeded ? (
            <CheckCircle2 size={21} />
          ) : (
            <ServerCog size={21} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-extrabold text-ink">{job.title}</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">{job.description}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-pill px-2 py-1 text-[11px] font-bold uppercase',
                failed
                  ? 'bg-redSoft text-red'
                  : succeeded
                    ? 'bg-greenSoft text-green'
                    : 'bg-line/60 text-muted',
              )}
            >
              {run?.status ?? (loading ? 'Loading' : 'No Runs')}
            </span>
          </div>

          {run && (
            <div className="mt-3 space-y-2 border-t border-line/70 pt-3">
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <StatusFact label="Started" value={formatDateTime(run.started_at)} />
                <StatusFact label="Finished" value={formatDateTime(run.finished_at)} />
              </div>
              {run.summary && <SummaryFacts summary={run.summary} />}
              {run.error && (
                <p className="rounded-input bg-redSoft px-3 py-2 text-[12px] font-semibold text-red">
                  {run.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function SummaryFacts({ summary }: { summary: Record<string, unknown> }) {
  const facts = Object.entries(summary)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .slice(0, 6)

  if (!facts.length) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {facts.map(([key, value]) => (
        <StatusFact key={key} label={formatKey(key)} value={String(value)} />
      ))}
    </div>
  )
}

function StatusFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-input bg-surfaceSoft px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-semibold text-ink">{value}</p>
    </div>
  )
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatKey(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 24)
}
