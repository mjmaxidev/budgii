import { Capacitor } from '@capacitor/core'
import { Camera, CameraDirection, EncodingType } from '@capacitor/camera'

const CAMERA_TIMEOUT_MS = 2500

export function canUseNativeCamera(): boolean {
  return Capacitor.isNativePlatform()
}

export async function captureReceiptPhoto(): Promise<File | null> {
  const photo = await withTimeout(
    Camera.takePhoto({
      quality: 85,
      correctOrientation: true,
      cameraDirection: CameraDirection.Rear,
      editable: 'no',
      encodingType: EncodingType.JPEG,
      saveToGallery: false,
      presentationStyle: 'fullscreen',
    }),
    CAMERA_TIMEOUT_MS,
  )

  if (!photo.webPath) return null

  const response = await fetch(photo.webPath)
  const blob = await response.blob()
  const rawFormat = photo.metadata?.format || 'jpg'
  const extension = rawFormat === 'jpeg' ? 'jpg' : rawFormat
  const type = blob.type || (extension === 'png' ? 'image/png' : 'image/jpeg')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  return new File([blob], `receipt-${timestamp}.${extension}`, { type })
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('Camera did not open.'))
    }, timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}
