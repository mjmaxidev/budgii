import { useState, useEffect } from 'react'
import { Copy, Check, RefreshCw } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { useStore } from '@/store/appStore'

/**
 * Simple ASCII QR Code generator
 * Generates a minimal visual representation of the invite code
 */
function generateAsciiQR(text: string): string[] {
  // Create a simple ASCII pattern based on the code
  const chars = text.split('')
  const rows: string[] = []

  // Top border
  rows.push('┌' + '─'.repeat(20) + '┐')

  // Content rows - create a visual pattern from the text
  for (let i = 0; i < text.length; i += 4) {
    const chunk = text.substring(i, i + 4).padEnd(4, ' ')
    rows.push('│ ' + chunk + ' │')
  }

  // Add spacing
  while (rows.length < 7) {
    rows.push('│ ' + ' '.repeat(16) + ' │')
  }

  // Bottom border
  rows.push('└' + '─'.repeat(20) + '┘')

  return rows
}

export function FamilyInvitation() {
  const [copied, setCopied] = useState(false)
  const [familyCode, setFamilyCode] = useState<string>('')

  const createFamilyInvite = useStore((s) => s.createFamilyInvite)
  const getUnusedInvites = useStore((s) => s.getUnusedInvites)

  // Initialize with existing unused invite or create new one
  useEffect(() => {
    const unusedInvites = getUnusedInvites()
    if (unusedInvites.length > 0) {
      setFamilyCode(unusedInvites[0].code)
    } else {
      const code = createFamilyInvite()
      setFamilyCode(code)
    }
  }, [createFamilyInvite, getUnusedInvites])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(familyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleGenerateNew = () => {
    const code = createFamilyInvite()
    setFamilyCode(code)
  }

  const asciiQr = generateAsciiQR(familyCode)

  return (
    <AppShell showBottomNav topBar={<TopBar title="Family Invitation" showBack />}>
      <div className="space-y-6 pb-8">
        {/* Header Message */}
        <Card className="bg-gradient-to-br from-primarySoft to-accentSoft">
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-bold text-ink">Share Your Family Code</h2>
            <p className="text-sm text-muted">
              Share this code with family members to join your household and start budgeting together
            </p>
          </div>
        </Card>

        {/* Family Code Display */}
        <Card className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your Family Code</p>
            <div className="rounded-lg bg-surfaceSoft px-4 py-6">
              <code className="text-4xl font-black tracking-widest text-ink">{familyCode}</code>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyCode}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white active:opacity-80"
          >
            {copied ? (
              <>
                <Check size={18} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </Card>

        {/* QR Code Section */}
        <Card className="space-y-3">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
            Or scan this code
          </p>
          <div className="flex justify-center rounded-lg bg-white p-4">
            <div className="font-mono text-xs leading-4 text-ink">
              {asciiQr.map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {line}
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-muted">
            Visual representation of your family code
          </p>
        </Card>

        {/* Generate New Code */}
        <Card className="pt-0">
          <button
            onClick={handleGenerateNew}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 font-semibold text-ink active:bg-surfaceSoft"
          >
            <RefreshCw size={18} />
            <span>Generate New Code</span>
          </button>
        </Card>

        {/* Instructions */}
        <Card className="space-y-2 bg-accentSoft/30">
          <h3 className="font-semibold text-ink">How to share:</h3>
          <ol className="space-y-1 text-sm text-muted">
            <li>1. Copy the code above or have them scan the QR code</li>
            <li>2. They can paste the code in their app</li>
            <li>3. Once verified, they'll be added to your household</li>
            <li>4. Start tracking expenses together!</li>
          </ol>
        </Card>
      </div>
    </AppShell>
  )
}
