import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Info, Tag, Wand2, Users, Trash2, Link as LinkIcon } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'
import { ToggleRow } from '@/components/ui/ToggleRow'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/appStore'
import { withFrom } from '@/utils/navigation'

const AVATARS = ['👩', '👨', '👧', '👦', '🧒', '👶', '🧑', '🧓']

export function FamilyMembers() {
  const navigate = useNavigate()
  const members = useStore((s) => s.familyMembers)
  const addFamilyMember = useStore((s) => s.addFamilyMember)
  const deleteFamilyMember = useStore((s) => s.deleteFamilyMember)
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

  const [edit, setEdit] = useState(false)
  const [modal, setModal] = useState(false)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[6])

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
      <ActionButton onClick={() => navigate('/family-invitation', withFrom('/family-members'))} className="mb-4">
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
          onChange={(v) => updateSettings({ useMembersAsTags: v })}
        />
        <div className="h-px bg-line/70" />
        <ToggleRow
          icon={<Wand2 size={18} className="text-green" />}
          title="Suggest member based on receipt history"
          description="We'll suggest the best match automatically."
          checked={settings.suggestMemberFromHistory}
          onChange={(v) => updateSettings({ suggestMemberFromHistory: v })}
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
        Done
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

    </AppShell>
  )
}
