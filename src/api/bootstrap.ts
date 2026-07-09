import { getMe, loginEmail, register } from '@/api/auth'
import { createHousehold, getHouseholdBootstrap, joinHousehold, listHouseholds } from '@/api/households'
import { listPersonas } from '@/api/personas'
import { apiExpensesToExpenses, applyDueRecurringTransactions, listAllExpenses } from '@/api/expenses'
import {
  apiReceiptItemsToReceiptItems,
  apiReceiptsToReceipts,
  listAllReceipts,
  listReceiptItems,
} from '@/api/receipts'
import { pullSync, pushSync } from '@/api/sync'
import { personasToFamilyMembers } from '@/api/personaMap'
import { pickSyncSnapshot, SYNC_KEYS, type SyncKey } from '@/api/syncKeys'
import { useAuthStore } from '@/store/authStore'
import { useStore, type AppStore, type FamilyInvite } from '@/store/appStore'
import type { HouseholdBootstrapResponse, InviteResponse } from '@/api/types'
import { formatInviteCode } from '@/utils/familyInvite'

export function inviteResponseToFamilyInvite(invite: InviteResponse): FamilyInvite {
  return {
    id: invite.id ?? invite.code,
    code: formatInviteCode(invite.code),
    createdAt: dateOnly(invite.sent_at ?? invite.expires_at) ?? new Date().toISOString().split('T')[0],
    accessRole: invite.access_role,
    editorLevel: invite.editor_level ?? undefined,
    sentToContact: invite.sent_to_contact ?? undefined,
    sentAt: dateOnly(invite.sent_at) ?? undefined,
    usedAt: dateOnly(invite.used_at) ?? undefined,
    usedBy: invite.used_by ?? undefined,
  }
}

function dateOnly(value: string | null | undefined): string | undefined {
  return value?.split('T')[0]
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

    if (options?.migrateLocal) {
      const snapshot = pickSyncSnapshot(useStore.getState())
      await pushSync(householdId, snapshot, 1)
    }

    await bootstrapAndHydrate(householdId)

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
  migrateLocal = false,
): Promise<void> {
  await register(email, password, name)
  const household = await createHousehold(householdName)
  useAuthStore.getState().setHouseholdId(household.id)
  await bootstrapSession({ migrateLocal })
}

export async function loginAndBootstrap(email: string, password: string): Promise<void> {
  await loginEmail(email, password)
  await bootstrapSession()
}

export async function joinHouseholdAndBootstrap(code: string): Promise<void> {
  const household = await joinHousehold(code)
  useAuthStore.getState().setHouseholdId(household.id)
  await bootstrapSession()
}

export async function pullAndHydrate(householdId: string, isAccountHolder?: boolean): Promise<void> {
  const auth = useAuthStore.getState()
  const since = auth.lastSyncedAt ?? undefined
  const pull = await pullSync(householdId, since)

  if (Object.keys(pull.snapshot).length > 0) {
    hydrateFromSnapshot(pull.snapshot)
  }

  const { personas } = await listPersonas(householdId)
  const householdIsAccountHolder =
    isAccountHolder ?? useStore.getState().familyMembers.some((member) => member.isAccountHolder)
  const familyMembers = personasToFamilyMembers(personas, householdIsAccountHolder)
  await hydrateNormalizedData(householdId, { familyMembers })

  auth.setSyncMeta(pull.revision, pull.server_time)
}

export async function bootstrapAndHydrate(householdId: string): Promise<void> {
  const auth = useAuthStore.getState()
  const bootstrap = await getHouseholdBootstrap(householdId)

  hydrateFromBootstrap(bootstrap)
  await hydrateNormalizedData(householdId)

  auth.setSyncMeta(bootstrap.revision, bootstrap.server_time)
}

function hydrateFromBootstrap(bootstrap: HouseholdBootstrapResponse): void {
  hydrateFromSnapshot(bootstrap.snapshot)

  useStore.setState({
    familyMembers: personasToFamilyMembers(bootstrap.personas, bootstrap.household.is_account_holder),
    familyInvites: bootstrap.invites.map(inviteResponseToFamilyInvite),
  })
}

async function hydrateNormalizedData(householdId: string, patch: Partial<AppStore> = {}): Promise<void> {
  try {
    const applied = await applyDueRecurringTransactions(householdId)
    if (applied.applied_count > 0) {
      console.info(`[recurring] applied ${applied.applied_count} due transaction(s)`)
      if (applied.recurring_transactions.length > 0) {
        useStore.setState({ recurringTransactions: applied.recurring_transactions })
      }
    }
  } catch (err) {
    console.info('[recurring] due transaction application skipped', err)
  }

  const expenses = apiExpensesToExpenses(await listAllExpenses(householdId))
  const apiReceipts = await listAllReceipts(householdId)
  const receiptItems = apiReceiptItemsToReceiptItems(
    (await Promise.all(apiReceipts.map((receipt) => listReceiptItems(householdId, receipt.id)))).flatMap(
      (response) => response.items,
    ),
  )

  useStore.setState({
    ...patch,
    expenses,
    receipts: apiReceiptsToReceipts(apiReceipts),
    receiptItems,
  })
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

export function buildChangesForKeys(state: AppStore, keys: Iterable<SyncKey>): Record<string, unknown> {
  const changes: Record<string, unknown> = {}
  for (const key of keys) {
    changes[key] = state[key]
  }
  return changes
}
