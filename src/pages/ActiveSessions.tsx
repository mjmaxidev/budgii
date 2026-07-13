import { useCallback, useEffect, useState } from 'react'
import { MonitorSmartphone, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { ActionButton } from '@/components/ui/ActionButton'
import { Card } from '@/components/ui/Card'
import { ApiError } from '@/api/client'
import { isApiEnabled } from '@/api/config'
import { listSessions, revokeSession } from '@/api/auth'
import type { SessionResponse } from '@/api/types'
import { formatDateTime } from '@/utils/dates'

export function ActiveSessions() {
  const apiOn = isApiEnabled()
  const [sessions, setSessions] = useState<SessionResponse[]>([])
  const [loading, setLoading] = useState(apiOn)
  const [error, setError] = useState('')
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await listSessions()
      setSessions(response.sessions)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load active sessions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!apiOn) return
    void loadSessions()
  }, [apiOn, loadSessions])

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId)
    setError('')
    try {
      await revokeSession(sessionId)
      setSessions((current) => current.filter((session) => session.id !== sessionId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove this session.')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <AppShell showBottomNav topBar={<TopBar title="Active Sessions" showBack />}>
      <div className="mt-4 space-y-4">
        <Card soft>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-greenSoft text-green">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-ink">Signed-in devices</p>
              <p className="mt-1 text-[13px] leading-5 text-muted">
                Removing a session stops that device from refreshing its login.
              </p>
            </div>
          </div>
        </Card>

        {!apiOn ? (
          <Card>
            <p className="text-[15px] font-bold text-ink">Backend mode required</p>
            <p className="mt-1 text-[13px] leading-5 text-muted">
              Active sessions are available when Budgii is connected to the API.
            </p>
          </Card>
        ) : loading ? (
          <Card>
            <div className="flex items-center gap-2 text-[14px] font-semibold text-muted">
              <RefreshCw size={16} className="animate-spin" />
              Loading sessions...
            </div>
          </Card>
        ) : (
          <>
            {error && (
              <p className="rounded-input bg-red/10 px-3 py-2 text-[13px] font-semibold text-red">{error}</p>
            )}

            {sessions.length === 0 ? (
              <Card>
                <p className="text-[15px] font-bold text-ink">No active sessions</p>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  New logins will appear here after authentication.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    revoking={revokingId === session.id}
                    onRevoke={() => void handleRevoke(session.id)}
                  />
                ))}
              </div>
            )}

            <ActionButton
              variant="outline"
              onClick={() => void loadSessions()}
              disabled={loading || !!revokingId}
              leftIcon={<RefreshCw size={18} />}
            >
              Refresh
            </ActionButton>
          </>
        )}
      </div>
    </AppShell>
  )
}

type SessionCardProps = {
  session: SessionResponse
  revoking: boolean
  onRevoke: () => void
}

function SessionCard({ session, revoking, onRevoke }: SessionCardProps) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primarySoft text-primary">
          <MonitorSmartphone size={21} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{deviceLabel(session.user_agent)}</p>
          <p className="mt-1 text-[13px] text-muted">{session.ip_address || 'Unknown IP'}</p>
          <dl className="mt-3 space-y-1 text-[12px] leading-5">
            <SessionFact label="Created" value={formatDateTime(session.created_at)} />
            <SessionFact
              label="Last used"
              value={session.last_used_at ? formatDateTime(session.last_used_at) : 'Not recorded'}
            />
            <SessionFact label="Expires" value={formatDateTime(session.expires_at)} />
          </dl>
        </div>
        <button
          type="button"
          onClick={onRevoke}
          disabled={revoking}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-red active:bg-red/10 disabled:opacity-50"
          aria-label="Remove session"
        >
          {revoking ? <RefreshCw size={17} className="animate-spin" /> : <Trash2 size={17} />}
        </button>
      </div>
    </Card>
  )
}

function SessionFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-semibold text-ink">{value}</dd>
    </div>
  )
}

function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device'
  if (/iphone|ipad|ios/i.test(userAgent)) return 'iOS device'
  if (/android/i.test(userAgent)) return 'Android device'
  if (/electron/i.test(userAgent)) return 'Budgii desktop'
  if (/chrome/i.test(userAgent)) return 'Chrome browser'
  if (/safari/i.test(userAgent)) return 'Safari browser'
  if (/firefox/i.test(userAgent)) return 'Firefox browser'
  return userAgent
}
