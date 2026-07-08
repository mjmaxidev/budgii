import { createContext, useContext } from 'react'

export type AnnotationApi = {
  enabled: boolean
  setEnabled: (next: boolean) => void
  undo: () => void
  clear: () => void
  clearAll: () => void
  canUndo: boolean
  hasMarks: boolean
  hasAnyMarks: boolean
}

export const AnnotationContext = createContext<AnnotationApi | null>(null)

export function useAnnotation(): AnnotationApi {
  const ctx = useContext(AnnotationContext)
  if (!ctx) throw new Error('useAnnotation must be used within <AnnotationProvider>')
  return ctx
}
