import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { ActionButton } from '@/components/ui/ActionButton'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { useStore } from '@/store/appStore'
import { CATEGORY_COLOR_CHOICES, CATEGORY_ICON_CHOICES } from '@/constants/categoryChoices'
import { ColorPickerField } from '@/components/ui/ColorPickerField'

type Props = {
  open: boolean
  onClose: () => void
  onSaved: (categoryId: string) => void
  editCategoryId?: string
}

export function CategoryCreateModal({ open, onClose, onSaved, editCategoryId }: Props) {
  const categories = useStore((s) => s.categories)
  const addCategory = useStore((s) => s.addCategory)
  const updateCategory = useStore((s) => s.updateCategory)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(CATEGORY_ICON_CHOICES[0])
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0])

  useEffect(() => {
    if (!open) return
    if (editCategoryId) {
      const cat = categories.find((c) => c.id === editCategoryId)
      setName(cat?.name ?? '')
      setIcon(cat?.icon ?? CATEGORY_ICON_CHOICES[0])
      setColor(cat?.color ?? CATEGORY_COLOR_CHOICES[0])
      return
    }
    setName('')
    setIcon(CATEGORY_ICON_CHOICES[0])
    setColor(CATEGORY_COLOR_CHOICES[0])
  }, [open, editCategoryId, categories])

  function save() {
    if (!name.trim()) return
    if (editCategoryId) {
      updateCategory(editCategoryId, { name: name.trim(), icon, color })
      onSaved(editCategoryId)
      return
    }
    const id = addCategory(name.trim(), icon, color)
    onSaved(id)
  }

  return (
    <Modal open={open} onClose={onClose} title={editCategoryId ? 'Edit Category' : 'Create Category'}>
      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={color} size={44} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="flex-1 rounded-input border border-line bg-surface px-4 py-3 text-[15px] outline-none"
        />
      </div>

      <p className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-wide text-muted">Icon</p>
      <div className="grid grid-cols-8 gap-1.5">
        {CATEGORY_ICON_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setIcon(emoji)}
            className={`flex h-9 items-center justify-center rounded-lg text-xl transition ${
              icon === emoji ? 'bg-primarySoft ring-2 ring-primary' : 'bg-surface active:bg-line/40'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <ColorPickerField value={color} onChange={setColor} presets={CATEGORY_COLOR_CHOICES} label="Colour" />
      </div>

      <ActionButton onClick={save} className="mt-5" leftIcon={<Plus size={18} />}>
        {editCategoryId ? 'Save Category' : 'Add Category'}
      </ActionButton>
    </Modal>
  )
}

/** Compact + tile for 4-column category grids */
export function CategoryAddTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-line bg-surfaceSoft p-2 transition active:bg-line/30"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primarySoft">
        <Plus size={18} className="text-primary" />
      </div>
      <span className="text-[10px] font-semibold text-primary">Add</span>
    </button>
  )
}
