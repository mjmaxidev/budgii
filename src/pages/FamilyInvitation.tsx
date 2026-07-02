import { useState, useEffect } from 'react'
import { Copy, Check, RefreshCw, Mail, Phone, Send } from 'lucide-react'
import QRCode from 'react-qr-code'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { useStore } from '@/store/appStore'
import { buildFamilyInviteUrl } from '@/utils/familyInvite'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

function isValidInviteContact(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.includes('@')) return isValidEmail(trimmed)
  return isValidPhone(trimmed)
}

export function FamilyInvitation() {
  const [copied, setCopied] = useState(false)
  const [familyCode, setFamilyCode] = useState<string>('')
  const [inviteeContact, setInviteeContact] = useState('')
  const [contactError, setContactError] = useState('')
  const [sentTo, setSentTo] = useState('')

  const createFamilyInvite = useStore((s) => s.createFamilyInvite)
  const getUnusedInvites = useStore((s) => s.getUnusedInvites)
  const sendFamilyInvite = useStore((s) => s.sendFamilyInvite)

  useEffect(() => {
    const unusedInvites = getUnusedInvites()
    if (unusedInvites.length > 0) {
      setFamilyCode(unusedInvites[0].code)
    } else {
      const code = createFamilyInvite()
      setFamilyCode(code)
    }
  }, [createFamilyInvite, getUnusedInvites])

  const inviteUrl = familyCode ? buildFamilyInviteUrl(familyCode) : ''

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
    setSentTo('')
    setContactError('')
  }

  const handleSendInvite = () => {
    const contact = inviteeContact.trim()
    if (!isValidInviteContact(contact)) {
      setContactError('Enter a valid email address or phone number.')
      return
    }
    if (!familyCode) return
    setContactError('')
    sendFamilyInvite(familyCode, contact)
    setSentTo(contact)
    setTimeout(() => setSentTo(''), 4000)
  }

  const contactReady = isValidInviteContact(inviteeContact)
  const contactLooksLikePhone = inviteeContact.trim().length > 0 && !inviteeContact.includes('@')

  return (
    <AppShell showBottomNav topBar={<TopBar title="Family Invitation" showBack />}>
      <div className="space-y-4 pb-8">
        <Card className="bg-gradient-to-br from-primarySoft to-accentSoft">
          <div className="space-y-2 text-center">
            <h2 className="text-[17px] font-extrabold text-ink">Share Your Family Code</h2>
            <p className="text-[13px] leading-snug text-muted">
              Share this code with family members to join your household and start budgeting together
            </p>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Your Family Code</p>
            <div className="rounded-input bg-surfaceSoft px-4 py-5">
              <code className="text-[32px] font-black tracking-[0.2em] text-ink">{familyCode}</code>
            </div>
          </div>

          <ActionButton
            onClick={handleCopyCode}
            leftIcon={copied ? <Check size={18} /> : <Copy size={18} />}
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </ActionButton>
        </Card>

        <Card className="space-y-3">
          <p className="text-center text-[12px] font-bold uppercase tracking-wide text-muted">
            Or send invite
          </p>
          <FormField
            type="text"
            label="Email or phone number"
            placeholder="family@example.com or +61 412 345 678"
            leftIcon={contactLooksLikePhone ? <Phone size={18} /> : <Mail size={18} />}
            value={inviteeContact}
            onChange={(e) => {
              setInviteeContact(e.target.value)
              if (contactError) setContactError('')
            }}
            autoComplete="email tel"
            inputMode={contactLooksLikePhone ? 'tel' : 'email'}
          />
          <ActionButton
            size="md"
            variant="green"
            onClick={handleSendInvite}
            disabled={!contactReady}
            leftIcon={sentTo ? <Check size={16} /> : <Send size={16} />}
          >
            {sentTo ? 'Invite Sent!' : 'Send Invite'}
          </ActionButton>
          {contactError && (
            <p className="text-center text-[13px] font-semibold text-red">{contactError}</p>
          )}
          {sentTo && !contactError && (
            <p className="text-center text-[13px] font-semibold text-green">
              Code {familyCode} sent to {sentTo}
            </p>
          )}
        </Card>

        <Card className="space-y-4">
          <p className="text-center text-[12px] font-bold uppercase tracking-wide text-muted">
            Or scan this code
          </p>
          <div className="flex justify-center rounded-input bg-white p-4">
            {inviteUrl ? (
              <QRCode
                value={inviteUrl}
                size={180}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#1C1917"
                title={`Join Budgii family — code ${familyCode}`}
              />
            ) : (
              <div className="h-[180px] w-[180px] animate-pulse rounded-lg bg-line/40" />
            )}
          </div>
          <p className="text-center text-[12px] leading-snug text-muted">
            Scan to download Budgii or join your household with this invite
          </p>
          {inviteUrl && (
            <p className="break-all text-center text-[11px] text-muted/80">{inviteUrl}</p>
          )}
          <ActionButton
            size="md"
            variant="outline"
            onClick={handleGenerateNew}
            leftIcon={<RefreshCw size={16} />}
          >
            Generate New Code
          </ActionButton>
        </Card>

        <Card className="space-y-2 bg-accentSoft/30">
          <h3 className="text-[15px] font-bold text-ink">How to share:</h3>
          <ol className="space-y-1 text-[13px] leading-snug text-muted">
            <li>1. Copy the code, send by email or text, or have them scan the QR code</li>
            <li>2. If they don&apos;t have Budgii, the link helps them download the app</li>
            <li>3. Once they open the link, they&apos;ll be added to your household</li>
            <li>4. Start tracking expenses together!</li>
          </ol>
        </Card>
      </div>
    </AppShell>
  )
}
