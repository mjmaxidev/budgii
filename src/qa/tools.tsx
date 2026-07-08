/**
 * QA-only tool views. These are NOT part of the app — they render inside the QA
 * studio (in place of the app iframe) when selected from the nav rail.
 */
import type { ReactNode } from 'react'

const ToolPlaceholder = ({ name }: { name: string }) => (
  <div className="flex h-full w-full items-center justify-center bg-surface">
    <div className="text-center">
      <p className="mb-2 text-muted">{name}</p>
      <p className="text-[13px] text-muted/60">(QA workspace)</p>
    </div>
  </div>
)

export type QaTool = {
  key: string
  label: string
  description: string
  element: ReactNode
}

export const qaTools: QaTool[] = [
  {
    key: 'component-library',
    label: 'Component Library',
    description: 'Reusable components',
    element: <ToolPlaceholder name="Component Library" />,
  },
  {
    key: 'mock-data',
    label: 'Mock Data',
    description: 'Test data setup',
    element: <ToolPlaceholder name="Mock Data Manager" />,
  },
  {
    key: 'performance',
    label: 'Performance',
    description: 'Metrics & timing',
    element: <ToolPlaceholder name="Performance Monitor" />,
  },
  {
    key: 'accessibility',
    label: 'Accessibility',
    description: 'A11y validation',
    element: <ToolPlaceholder name="Accessibility Checker" />,
  },
  {
    key: 'design-tokens',
    label: 'Design Tokens',
    description: 'Colors, spacing, typography',
    element: <ToolPlaceholder name="Design Tokens" />,
  },
]
