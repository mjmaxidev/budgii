import { isApiEnabled } from '@/api/config'
import { pullAndHydrate, buildChangesForKeys } from '@/api/bootstrap'
import { pushSync } from '@/api/sync'
import { SYNC_KEYS, type SyncKey } from '@/api/syncKeys'
import { useAuthStore } from '@/store/authStore'
import { useStore } from '@/store/appStore'

const PUSH_DEBOUNCE_MS = 800
const PULL_INTERVAL_MS = 60_000

let hydrating = false
let pushTimer: ReturnType<typeof setTimeout> | null = null
let pullTimer: ReturnType<typeof setInterval> | null = null
let dirtyKeys = new Set<SyncKey>()
let unsubscribe: (() => void) | null = null
let pushing = false

export function setHydrating(value: boolean): void {
  hydrating = value
}

export function startSyncEngine(): void {
  if (!isApiEnabled()) return
  stopSyncEngine()

  unsubscribe = useStore.subscribe((state, prevState) => {
    if (hydrating) return
    const { householdId, accessToken } = useAuthStore.getState()
    if (!householdId || !accessToken) return

    for (const key of SYNC_KEYS) {
      if (state[key] !== prevState[key]) {
        dirtyKeys.add(key)
      }
    }
    if (dirtyKeys.size > 0) {
      schedulePush()
    }
  })

  pullTimer = setInterval(() => {
    void periodicPull()
  }, PULL_INTERVAL_MS)
}

export function stopSyncEngine(): void {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  if (pullTimer) {
    clearInterval(pullTimer)
    pullTimer = null
  }
  dirtyKeys.clear()
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    void flushPush()
  }, PUSH_DEBOUNCE_MS)
}

async function flushPush(): Promise<void> {
  if (pushing || hydrating || dirtyKeys.size === 0) return

  const { householdId, syncRevision, accessToken } = useAuthStore.getState()
  if (!householdId || !accessToken) return

  const keys = [...dirtyKeys]
  dirtyKeys.clear()
  pushing = true

  try {
    const changes = buildChangesForKeys(useStore.getState(), keys)
    const result = await pushSync(householdId, changes, syncRevision)

    if (result.accepted) {
      useAuthStore.getState().setSyncMeta((syncRevision ?? 0) + 1, result.server_time)
    } else if (result.conflicts.length > 0) {
      hydrating = true
      try {
        await pullAndHydrate(householdId)
      } finally {
        hydrating = false
      }
    }
  } catch (err) {
    console.error('[sync] push failed', err)
    for (const key of keys) dirtyKeys.add(key)
  } finally {
    pushing = false
  }
}

async function periodicPull(): Promise<void> {
  const { householdId, accessToken } = useAuthStore.getState()
  if (!householdId || !accessToken || hydrating || pushing) return

  hydrating = true
  try {
    await pullAndHydrate(householdId)
  } catch (err) {
    console.error('[sync] pull failed', err)
  } finally {
    hydrating = false
  }
}

export async function flushSyncNow(): Promise<void> {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  await flushPush()
}
