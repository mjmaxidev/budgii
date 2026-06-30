import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TopBar } from '@/components/layout/TopBar'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { ActionButton } from '@/components/ui/ActionButton'
import { CategoryIcon } from '@/components/ui/CategoryIcon'
import { Chip } from '@/components/ui/Chip'
import { useStore } from '@/store/appStore'

// Color and icon palettes from store
const COLOR_PALETTE = ['#16A34A', '#FB8500', '#2386F6', '#9B5DE5', '#EF4444', '#F59E0B']
const ICON_PALETTE = ['🛒', '🍽️', '🚗', '🛍️', '📄', '❤️', '⭐', '🎁', '✈️', '🏠']

export function CategoryCreation() {
  const navigate = useNavigate()
  const addCategory = useStore((s) => s.addCategory)

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0])
  const [selectedIcon, setSelectedIcon] = useState(ICON_PALETTE[0])

  function save() {
    if (!name.trim()) return
    const id = addCategory(name.trim(), selectedIcon, selectedColor)
    navigate('/categories-tags')
  }

  const isValid = name.trim().length > 0

  return (
    <AppShell topBar={<TopBar title="Create Category" showBack />}>
      <div className="space-y-5 px-4 py-5">
        {/* Preview */}
        <div className="flex justify-center py-6">
          <CategoryIcon icon={selectedIcon} color={selectedColor} size={80} className="rounded-3xl text-4xl" />
        </div>

        {/* Name Input */}
        <FormField
          label="Category Name"
          placeholder="e.g., Groceries"
          value={name}
          onChange={(e) => setName(e.target.value)}
          containerClassName="w-full"
        />

        {/* Color Picker */}
        <div>
          <label className="mb-2.5 block text-[13px] font-semibold text-muted">Color</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="h-10 w-10 rounded-full border-2 transition-transform active:scale-90"
                style={{
                  backgroundColor: color,
                  borderColor: selectedColor === color ? 'rgba(0, 0, 0, 0.4)' : 'transparent',
                  borderWidth: selectedColor === color ? 2 : 1,
                }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="mb-2.5 block text-[13px] font-semibold text-muted">Icon</label>
          <div className="flex flex-wrap gap-2">
            {ICON_PALETTE.map((icon) => (
              <button
                key={icon}
                onClick={() => setSelectedIcon(icon)}
                className="flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl transition-all active:scale-90"
                style={{
                  borderColor: selectedIcon === icon ? selectedColor : 'transparent',
                  backgroundColor: selectedIcon === icon ? `rgba(0, 0, 0, 0.05)` : 'transparent',
                  borderWidth: selectedIcon === icon ? 2 : 1,
                }}
                aria-label={`Icon ${icon}`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Chip */}
        <Card className="flex items-center justify-center py-6">
          <Chip color={selectedColor}>{name || 'Category Name'}</Chip>
        </Card>
      </div>

      {/* Save Button */}
      <div className="absolute inset-x-0 bottom-0 flex gap-3 border-t border-line/40 bg-background px-4 py-4">
        <ActionButton variant="secondary" onClick={() => navigate('/categories-tags')} className="flex-1">
          Cancel
        </ActionButton>
        <ActionButton onClick={save} disabled={!isValid} className="flex-1">
          Create
        </ActionButton>
      </div>
    </AppShell>
  )
}
