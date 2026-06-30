import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Info, Tag, Wand2, Users, Trash2, Copy, Check, Link as LinkIcon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'

const AVATARS = ['👩', '👨', '👧', '👦', '🧒', '👶', '🧑', '🧓']

export function FamilyMembers() {
  const navigate = useNavigate()
  const members = useStore((s) => s.familyMembers)
  const addFamilyMember = useStore((s) => s.addFamilyMember)
  const deleteFamilyMember = useStore((s) => s.deleteFamilyMember)
  const settings = useStore((s) => s.settings)
  const createFamilyInvite = useStore((s) => s.createFamilyInvite)
  const getUnusedInvites = useStore((s) => s.getUnusedInvites)

  const [edit, setEdit] = useState(false)
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[6])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  function save() {
    if (!name.trim()) return
    addFamilyMember({ name: name.trim(), relationship: relationship.trim() || 'Family', avatar })
    setName('')
    setRelationship('')
    setModal(false)
  }

  return (
    <AppShell topBar={<TopBar title="Family Members" showBack />}>
      <p className="mb-4 text-center text-[15px] text-muted">Assign expenses to each family member.</p>

      {/* Generate Invitation Link */}
      <ActionButton
        onClick={() => {
          const code = createFamilyInvite()
          setInviteCode(code)
          setShowInvite(true)
        }}
        className="mb-4"
      >
        <LinkIcon size={18} /> Generate Invitation Link
      </ActionButton>

      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold text-ink">Household Members</h2>
        <button onClick={() => setEdit((v) => !v)} className="text-[15px] font-bold text-primary">
          {edit ? 'Done' : 'Edit'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {members.map((m) => (
          <Card key={m.id} className="relative flex items-center gap-3 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surfaceSoft text-2xl">{m.avatar}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold text-ink">{m.name}</p>
              <p className="truncate text-[13px] text-muted">{m.relationship}</p>
              <span
                className={`mt-1 inline-block rounded-pill px-2 py-0.5 text-[11px] font-bold ${
                  m.isDefault ? 'bg-greenSoft text-green' : 'bg-greenSoft text-green'
                }`}
              >
                {m.isDefault ? 'Default tag' : 'Active'}
              </span>
            </div>
            {edit && !m.isDefault && (
              <button
                onClick={() => deleteFamilyMember(m.id)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red text-white"
              >
                <Trash2 size={13} />
              </button>
            )}
          </Card>
        ))}
        <button
          onClick={() => setModal(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-primary/40 py-5 text-primary active:bg-primarySoft"
        >
          <Plus size={26} />
          <span className="text-[14px] font-bold">Add Member</span>
        </button>
      </div>

      {/* How it works */}
      <Card className="mt-4 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
          <Info size={18} />
        </div>
        <div>
          <p className="text-[15px] font-bold text-ink">How it works</p>
          <p className="text-[13px] leading-snug text-muted">
            Members can be used as tags when adding expenses or reviewing receipt items. You can edit, add, or remove members anytime.
          </p>
        </div>
      </Card>

      {/* Member tag settings */}
      <h2 className="mt-6 text-[17px] font-extrabold text-ink">Member Tag Settings</h2>
      <Card className="mt-2 space-y-2">
        <ToggleRow
          icon={<Tag size={18} className="text-green" />}
          title="Use members as expense tags"
          description="Show members when adding expenses."
          checked={settings.useMembersAsTags}
          onChange={() => {
            // TODO: Implement updateSettings in store
          }}
        />
        <div className="h-px bg-line/70" />
        <ToggleRow
          icon={<Wand2 size={18} className="text-green" />}
          title="Suggest member based on receipt history"
          description="We'll suggest the best match automatically."
          checked={settings.suggestMemberFromHistory}
          onChange={() => {
            // TODO: Implement updateSettings in store
          }}
        />
      </Card>

      {/* Example tags */}
      <Card className="mt-4">
        <p className="mb-2 text-[15px] font-bold text-ink">Example Tags</p>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Chip key={m.id} color="#FB8500">
              {m.name}
            </Chip>
          ))}
          <button onClick={() => setModal(true)} className="inline-flex items-center gap-1 rounded-pill border-2 border-dashed border-line px-3 py-1.5 text-[13px] font-bold text-muted">
            <Plus size={14} /> Add
          </button>
        </div>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-2 text-[14px] text-muted">
        <Users size={18} className="text-green" /> Create shared household profile later
      </div>

      <ActionButton className="mt-4" onClick={() => navigate('/settings')}>
        Save Members
      </ActionButton>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Member">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Relationship (e.g. Child 4)"
          className="mt-3 w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
        <p className="mb-2 mt-4 text-[13px] font-semibold text-muted">Avatar</p>
        <div className="grid grid-cols-8 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`flex h-10 items-center justify-center rounded-xl border text-xl ${
                avatar === a ? 'border-primary bg-primarySoft' : 'border-line'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <ActionButton className="mt-5" onClick={save}>
          Add Member
        </ActionButton>
      </Modal>

      {/* Invite Link Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Family Member">
        <div className="rounded-card bg-surfaceSoft p-4">
          <p className="mb-3 text-center text-[14px] font-semibold text-muted">Share this code:</p>
          <div className="rounded-input border-2 border-primary bg-white p-4 text-center">
            <p className="text-[28px] font-extrabold tracking-wider text-primary">{inviteCode}</p>
          </div>
          <p className="mt-3 text-center text-[13px] text-muted">Family members can use this code to join your household.</p>

          {/* Simple ASCII QR placeholder */}
          <div className="mt-4 flex justify-center">
            <div className="rounded-input border border-line bg-white p-3 font-mono text-[10px] leading-tight text-ink">
              <div>████████████████████</div>
              <div>█ {inviteCode.substring(0, 10)} █</div>
              <div>████████████████████</div>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteCode)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className={`mt-4 w-full rounded-input px-4 py-3 text-[15px] font-bold transition-colors ${
              copied
                ? 'bg-green text-white'
                : 'bg-primarySoft text-primary active:bg-primary active:text-white'
            }`}
          >
            {copied ? <Check size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </Modal>
    </AppShell>
  )
}
