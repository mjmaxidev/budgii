import { Capacitor } from '@capacitor/core'
import { Camera, CameraDirection, EncodingType } from '@capacitor/camera'

export function canUseNativeCamera(): boolean {
  return Capacitor.isNativePlatform()
}

export async function captureReceiptPhoto(): Promise<File | null> {
  const photo = await Camera.takePhoto({
    quality: 85,
    correctOrientation: true,
    cameraDirection: CameraDirection.Rear,
    editable: 'no',
    encodingType: EncodingType.JPEG,
    saveToGallery: false,
    presentationStyle: 'fullscreen',
  })

  if (!photo.webPath) return null

  const response = await fetch(photo.webPath)
  const blob = await response.blob()
  const rawFormat = photo.metadata?.format || 'jpg'
  const extension = rawFormat === 'jpeg' ? 'jpg' : rawFormat
  const type = blob.type || (extension === 'png' ? 'image/png' : 'image/jpeg')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  return new File([blob], `receipt-${timestamp}.${extension}`, { type })
}
