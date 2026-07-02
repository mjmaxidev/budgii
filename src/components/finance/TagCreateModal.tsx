import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { Chip } from '@/components/ui/Chip'
import { useStore } from '@/store/appStore'
import { TAG_COLOR_CHOICES } from '@/constants/tagChoices'
import { ColorPickerField } from '@/components/ui/ColorPickerField'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: (tagId: string) => void
  editTagId?: string
}

export function TagCreateModal({ open, onClose, onSaved, editTagId }: Props) {
  const tags = useStore((s) => s.tags)
  const addTag = useStore((s) => s.addTag)
  const updateTag = useStore((s) => s.updateTag)
  const [name, setName] = useState('')
  const [color, setColor] = useState(TAG_COLOR_CHOICES[0])

  useEffect(() => {
    if (!open) return
    if (editTagId) {
      const tag = tags.find((t) => t.id === editTagId)
      setName(tag?.name ?? '')
      setColor(tag?.color ?? TAG_COLOR_CHOICES[0])
      return
    }
    setName('')
    setColor(TAG_COLOR_CHOICES[0])
  }, [open, editTagId, tags])

  function save() {
    if (!name.trim()) return
    if (editTagId) {
      updateTag(editTagId, { name: name.trim(), color })
      onSaved(editTagId)
      return
    }
    const id = addTag(name.trim(), color)
    onSaved(id)
  }

  return (
    <Modal open={open} onClose={onClose} title={editTagId ? 'Edit Tag' : 'Create Tag'}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tag name"
        className="w-full rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
      />

      {name.trim() && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[13px] text-muted">Preview</span>
          <Chip color={color} active>
            {name.trim()}
          </Chip>
        </div>
      )}

      <div className="mt-4">
        <ColorPickerField value={color} onChange={setColor} presets={TAG_COLOR_CHOICES} label="Colour" />
      </div>

      <ActionButton onClick={save} className="mt-5" leftIcon={<Plus size={18} />}>
        {editTagId ? 'Save Tag' : 'Add Tag'}
      </ActionButton>
    </Modal>
  )
}
