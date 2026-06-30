/**
 * Route Scanner — Auto-detects pages from router config
 * Extracts metadata to build PageNav automatically
 */

export type RouteMeta = {
  label: string
  icon?: string
  section?: string
  description?: string
  hidden?: boolean
}

export type RouteWithMeta = {
  path: string
  meta?: RouteMeta
}

export type PageLink = {
  to: string
  label: string
  sub?: string
  icon?: string
  section?: string
  note?: string
}

/**
 * Extract pages from routes config
 * Filters out hidden routes, organizes by section
 */
export function extractPagesFromRoutes(routes: RouteWithMeta[]): PageLink[] {
  return routes
    .filter((r) => r.meta && !r.meta.hidden)
    .map((r) => ({
      to: r.path,
      label: r.meta!.label,
      sub: r.meta!.description,
      icon: r.meta!.icon,
      section: r.meta!.section,
    }))
}

/**
 * Group pages by section for sidebar organization
 */
export function groupPagesBySection(pages: PageLink[]) {
  const grouped: Record<string, PageLink[]> = {}
  pages.forEach((page) => {
    const section = page.section || 'Other'
    if (!grouped[section]) grouped[section] = []
    grouped[section].push(page)
  })
  return grouped
}

/**
 * Get a single page meta by path
 */
export function getPageMeta(routes: RouteWithMeta[], path: string): PageLink | undefined {
  const route = routes.find((r) => r.path === path)
  if (!route?.meta) return undefined
  return {
    to: route.path,
    label: route.meta.label,
    sub: route.meta.description,
    icon: route.meta.icon,
    section: route.meta.section,
  }
}
