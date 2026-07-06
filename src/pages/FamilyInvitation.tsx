import { useState, useEffect } from 'react'
import { Copy, Check, RefreshCw, Mail, Phone, Send } from 'lucide-react'
import QRCode from 'react-qr-code'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { ActionButton } from '@/components/ui/ActionButton'
import { FormField } from '@/components/ui/FormField'
import { MemberAccessPicker } from '@/components/family/MemberAccessPicker'
import { useStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { buildFamilyInviteUrl } from '@/utils/familyInvite'
import type { EditorLevel, MemberAccessRole } from '@/types'
import { defaultEditorLevel, formatMemberAccessLabel } from '@/utils/memberAccess'
import { isApiEnabled } from '@/api/config'
import { createInvite } from '@/api/households'
import { ApiError } from '@/api/client'

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
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteeContact, setInviteeContact] = useState('')
  const [contactError, setContactError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberAccessRole>('editor')
  const [inviteEditorLevel, setInviteEditorLevel] = useState<EditorLevel>(defaultEditorLevel())
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const createFamilyInvite = useStore((s) => s.createFamilyInvite)
  const findFamilyInvite = useStore((s) => s.findFamilyInvite)
  const getUnusedInvites = useStore((s) => s.getUnusedInvites)
  const sendFamilyInvite = useStore((s) => s.sendFamilyInvite)
  const updateFamilyInvite = useStore((s) => s.updateFamilyInvite)
  const householdId = useAuthStore((s) => s.householdId)

  function applyLocalInvite(code: string) {
    setFamilyCode(code)
    const invite = findFamilyInvite(code)
    if (invite) {
      setInviteRole(invite.accessRole)
      setInviteEditorLevel(invite.editorLevel ?? defaultEditorLevel())
    }
  }

  async function createApiInvite(
    contact: string,
    accessRole: MemberAccessRole,
    editorLevel: EditorLevel,
  ) {
    if (!householdId) {
      setApiError('No household selected')
      return
    }
    setLoading(true)
    setApiError('')
    try {
      const invite = await createInvite(contact, householdId, accessRole, editorLevel)
      setFamilyCode(invite.code)
      setInviteUrl(invite.invite_url)
      setInviteRole(invite.access_role)
      setInviteEditorLevel(invite.editor_level ?? defaultEditorLevel())
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Could not create invite')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isApiEnabled()) {
      if (!householdId) return
      void createApiInvite('invite@budgii.local', inviteRole, inviteEditorLevel)
      return
    }

    const unusedInvites = getUnusedInvites()
    if (unusedInvites.length > 0) {
      applyLocalInvite(unusedInvites[0].code)
    } else {
      const code = createFamilyInvite('editor', defaultEditorLevel())
      applyLocalInvite(code)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createFamilyInvite, getUnusedInvites, householdId])

  const displayUrl = isApiEnabled() ? inviteUrl : familyCode ? buildFamilyInviteUrl(familyCode) : ''

  function syncInviteAccess(accessRole: MemberAccessRole, editorLevel: EditorLevel) {
    if (!familyCode) return
    if (!isApiEnabled()) {
      updateFamilyInvite(familyCode, { accessRole, editorLevel })
    }
    setInviteRole(accessRole)
    setInviteEditorLevel(editorLevel)
  }

  const handleGenerateNew = () => {
    if (isApiEnabled()) {
      const contact = inviteeContact.trim() || 'pending@budgii.local'
      void createApiInvite(contact, inviteRole, inviteEditorLevel)
    } else {
      const code = createFamilyInvite(inviteRole, inviteEditorLevel)
      applyLocalInvite(code)
    }
    setSentTo('')
    setContactError('')
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(familyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSendInvite = () => {
    const contact = inviteeContact.trim()
    if (!isValidInviteContact(contact)) {
      setContactError('Enter a valid email address or phone number.')
      return
    }
    if (!familyCode) return
    setContactError('')

    if (isApiEnabled()) {
      void createApiInvite(contact, inviteRole, inviteEditorLevel).then(() => {
        setSentTo(contact)
        setTimeout(() => setSentTo(''), 4000)
      })
      return
    }

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

        {apiError && (
          <p className="rounded-input bg-redSoft px-4 py-2 text-[13px] font-semibold text-red">
            {apiError}
          </p>
        )}

        <Card className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Your Family Code</p>
            <p className="font-mono text-[32px] font-extrabold tracking-[0.2em] text-ink">
              {loading && !familyCode ? '…' : familyCode}
            </p>
          </div>

          <MemberAccessPicker
            accessRole={inviteRole}
            editorLevel={inviteEditorLevel}
            onAccessRoleChange={(role) => syncInviteAccess(role, inviteEditorLevel)}
            onEditorLevelChange={(level) => syncInviteAccess(inviteRole, level)}
          />
          <p className="text-center text-[12px] text-muted">
            New members join as {formatMemberAccessLabel(inviteRole, inviteEditorLevel)}
          </p>

          <div className="flex gap-2">
            <ActionButton variant="outline" onClick={handleCopyCode} disabled={!familyCode || loading}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </ActionButton>
            <ActionButton variant="outline" onClick={handleGenerateNew} disabled={loading}>
              <RefreshCw size={18} />
              New Code
            </ActionButton>
          </div>
        </Card>

        {displayUrl && (
          <Card className="flex flex-col items-center gap-3 py-6">
            <p className="text-[12px] font-bold uppercase tracking-wide text-muted">Scan to join</p>
            <div className="rounded-xl bg-white p-3">
              <QRCode value={displayUrl} size={160} />
            </div>
            <p className="max-w-full truncate px-4 text-[11px] text-muted">{displayUrl}</p>
          </Card>
        )}

        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            {contactLooksLikePhone ? <Phone size={18} className="text-muted" /> : <Mail size={18} className="text-muted" />}
            <h3 className="text-[15px] font-bold text-ink">Send invite</h3>
          </div>
          <FormField
            placeholder={contactLooksLikePhone ? 'Phone number' : 'Email address'}
            value={inviteeContact}
            onChange={(e) => {
              setInviteeContact(e.target.value)
              if (contactError) setContactError('')
            }}
            leftIcon={contactLooksLikePhone ? <Phone size={18} /> : <Mail size={18} />}
          />
          {contactError && (
            <p className="text-[13px] font-semibold text-red">{contactError}</p>
          )}
          {sentTo && (
            <p className="text-[13px] font-semibold text-green">
              Invite saved for {sentTo}
              {isApiEnabled() ? ' (email delivery coming soon)' : ''}
            </p>
          )}
          <ActionButton onClick={handleSendInvite} disabled={!contactReady || loading}>
            <Send size={18} />
            Send Invite
          </ActionButton>
        </Card>
      </div>
    </AppShell>
  )
}
