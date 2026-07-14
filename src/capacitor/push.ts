import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'
import { registerDeviceToken } from '@/api/notifications'

let token: string | null = null
let initialized = false

function platform(): 'ios' | 'android' | null {
  const value = Capacitor.getPlatform()
  return value === 'ios' || value === 'android' ? value : null
}

export function initNativePushNotifications(): void {
  if (!Capacitor.isNativePlatform() || initialized) return
  initialized = true
  void PushNotifications.addListener('registration', (event) => {
    token = event.value
  })
  void PushNotifications.addListener('registrationError', (event) => {
    console.warn('Push registration failed:', event.error)
  })
}

export async function requestNativePushPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  initNativePushNotifications()
  const current = await PushNotifications.checkPermissions()
  const permission = current.receive === 'prompt' ? await PushNotifications.requestPermissions() : current
  if (permission.receive !== 'granted') return false
  await PushNotifications.register()
  return true
}

export async function registerNativePushToken(householdId: string): Promise<void> {
  const devicePlatform = platform()
  if (!token || !devicePlatform) return
  await registerDeviceToken(householdId, { token, platform: devicePlatform })
}
