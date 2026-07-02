const PIN_LENGTH = 4

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

export function generateSalt(): string {
  return crypto.randomUUID()
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyPin(pin: string, salt: string, pinHash: string): Promise<boolean> {
  if (!isValidPin(pin)) return false
  return (await hashPin(pin, salt)) === pinHash
}

export { PIN_LENGTH }
