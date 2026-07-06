import { getMe } from '@/api/auth'
import { createHousehold, joinHousehold, listHouseholds } from '@/api/households'
import { listPersonas } from '@/api/personas'
import { apiExpensesToExpenses, listAllExpenses } from '@/api/expenses'
import { pullSync, pushSync } from '@/api/sync'
import { personasToFamilyMembers } from '@/api/personaMap'
import { pickSyncSnapshot, SYNC_KEYS, type SyncKey } from '@/api/syncKeys'
import { useAuthStore } from '@/store/authStore'
import { useStore, type AppStore, type FamilyInvite } from '@/store/appStore'
import type { InviteResponse } from '@/api/types'
import { formatInviteCode } from '@/utils/familyInvite'

export function inviteResponseToFamilyInvite(invite: InviteResponse): FamilyInvite {
  return {
    id: invite.code,
    code: formatInviteCode(invite.code),
    createdAt: new Date().toISOString().split('T')[0],
    accessRole: invite.access_role,
    editorLevel: invite.editor_level ?? undefined,
    sentAt: new Date().toISOString().split('T')[0],
  }
}

export async function ensureHousehold(): Promise<string> {
  const auth = useAuthStore.getState()
  if (auth.householdId) return auth.householdId

  const { households } = await listHouseholds()
  if (households.length > 0) {
    auth.setHouseholdId(households[0].id)
    return households[0].id
  }

  throw new Error('No household found')
}

export async function bootstrapSession(options?: { migrateLocal?: boolean }): Promise<void> {
  const auth = useAuthStore.getState()
  auth.setStatus('loading')

  try {
    const user = await getMe()
    auth.setUser(user)

    const householdId = await ensureHousehold()
    auth.setHouseholdId(householdId)

    const household = (await listHouseholds()).households.find((h) => h.id === householdId)

    if (options?.migrateLocal) {
      const snapshot = pickSyncSnapshot(useStore.getState())
      await pushSync(householdId, snapshot, 1)
    }

    await pullAndHydrate(householdId, household?.is_account_holder)

    useStore.getState().setUserProfile({
      name: user.name,
      email: user.email,
      avatar: user.avatar ?? undefined,
    })

    auth.setStatus('authenticated')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to connect'
    auth.setStatus('error', message)
    throw err
  }
}

export async function registerAndCreateHousehold(
  email: string,
  password: string,
  name: string,
  householdName: string,
  migrateLocal = true,
): Promise<void> {
  const { register } = await import('@/api/auth')
  await register(email, password, name)
  const household = await createHousehold(householdName)
  useAuthStore.getState().setHouseholdId(household.id)
  await bootstrapSession({ migrateLocal })
}

export async function loginAndBootstrap(email: string, password: string): Promise<void> {
  const { loginEmail } = await import('@/api/auth')
  await loginEmail(email, password)
  await bootstrapSession()
}

export async function joinHouseholdAndBootstrap(code: string): Promise<void> {
  const household = await joinHousehold(code)
  useAuthStore.getState().setHouseholdId(household.id)
  await bootstrapSession()
}

export async function pullAndHydrate(
  householdId: string,
  isAccountHolder?: boolean,
): Promise<void> {
  const auth = useAuthStore.getState()
  const since = auth.lastSyncedAt ?? undefined
  const pull = await pullSync(householdId, since)

  if (Object.keys(pull.snapshot).length > 0) {
    hydrateFromSnapshot(pull.snapshot)
  }

  const { personas } = await listPersonas(householdId)
  const familyMembers = personasToFamilyMembers(personas, isAccountHolder)
  const expenses = apiExpensesToExpenses(await listAllExpenses(householdId))
  useStore.setState({ familyMembers, expenses })

  auth.setSyncMeta(pull.revision, pull.server_time)
}

function hydrateFromSnapshot(snapshot: Record<string, unknown>): void {
  const patch: Partial<AppStore> = {}
  for (const key of SYNC_KEYS) {
    if (key in snapshot) {
      ;(patch as Record<string, unknown>)[key] = snapshot[key]
    }
  }
  useStore.setState(patch)
}

export function buildChangesForKeys(
  state: AppStore,
  keys: Iterable<SyncKey>,
): Record<string, unknown> {
  const changes: Record<string, unknown> = {}
  for (const key of keys) {
    changes[key] = state[key]
  }
  return changes
}
