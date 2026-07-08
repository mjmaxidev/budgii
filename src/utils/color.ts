export function normalizeHex(value: string): string {
  const v = value.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v.toUpperCase()
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) {
    const [, r, g, b] = v
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`.toUpperCase()
  return value
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const n = normalizeHex(hex)
  if (!/^#[0-9A-F]{6}$/.test(n)) return null
  return {
    r: parseInt(n.slice(1, 3), 16),
    g: parseInt(n.slice(3, 5), 16),
    b: parseInt(n.slice(5, 7), 16),
  }
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`
}

import {
  CHALK_LIGHTNESS_MAX,
  CHALK_LIGHTNESS_MIN,
  CHALK_WHEEL_MAX_SATURATION,
} from '@/constants/chalkColors'

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 0, s: 40, l: CHALK_LIGHTNESS_MIN }
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6
  return { h: h * 360, s: s * 100, l: l * 100 }
}

/** Nudge any colour into soft chalk / pastel territory */
export function toChalkTone(hex: string): string {
  const { h, s, l } = hexToHsl(hex)
  const chalkS = Math.min(CHALK_WHEEL_MAX_SATURATION, Math.max(12, s * 0.88))
  const chalkL = Math.min(CHALK_LIGHTNESS_MAX, Math.max(CHALK_LIGHTNESS_MIN, l * 0.3 + 56))
  return hslToHex(h, chalkS, chalkL)
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100
  if (ss === 0) {
    const v = Math.round(ll * 255)
    return rgbToHex(v, v, v)
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  const hue = hh / 360
  const t = [hue + 1 / 3, hue, hue - 1 / 3].map((x) => {
    let v = x
    if (v < 0) v += 1
    if (v > 1) v -= 1
    if (v < 1 / 6) return p + (q - p) * 6 * v
    if (v < 1 / 2) return q
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6
    return p
  })
  return rgbToHex(t[0] * 255, t[1] * 255, t[2] * 255)
}

export function drawColorWheel(canvas: HTMLCanvasElement, lightness: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const size = canvas.width
  const cx = size / 2
  const cy = size / 2
  const radius = cx - 2
  const image = ctx.createImageData(size, size)
  const data = image.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const i = (y * size + x) * 4
      if (dist > radius) {
        data[i + 3] = 0
        continue
      }
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
      const sat = (dist / radius) * CHALK_WHEEL_MAX_SATURATION
      const hex = hslToHex(hue, sat, lightness)
      const rgb = hexToRgb(hex)!
      data[i] = rgb.r
      data[i + 1] = rgb.g
      data[i + 2] = rgb.b
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  // Soft chalk centre
  const chalkCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.22)
  chalkCore.addColorStop(0, 'rgba(255,252,248,0.95)')
  chalkCore.addColorStop(1, 'rgba(255,252,248,0)')
  ctx.fillStyle = chalkCore
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 2
  ctx.stroke()
}

export function pickColorFromWheel(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  lightness: number,
): string | null {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const cx = canvas.width / 2
  const cy = canvas.height / 2
  const radius = cx - 2
  const dx = (clientX - rect.left) * scaleX - cx
  const dy = (clientY - rect.top) * scaleY - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > radius) return null
  const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
  const sat = Math.min(CHALK_WHEEL_MAX_SATURATION, (dist / radius) * CHALK_WHEEL_MAX_SATURATION)
  return hslToHex(hue, sat, lightness)
}

export function hslMarkerPosition(h: number, s: number, size: number) {
  const cx = size / 2
  const cy = size / 2
  const radius = cx - 2
  const angle = (h * Math.PI) / 180
  const dist = (Math.min(s, CHALK_WHEEL_MAX_SATURATION) / CHALK_WHEEL_MAX_SATURATION) * radius
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
  }
}
