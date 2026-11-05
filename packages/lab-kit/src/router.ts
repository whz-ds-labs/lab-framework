import { shallowRef, type Ref } from 'vue'
import type { CourseDefinition, LabDefinition, ToolDefinition } from './define'
import type { Query } from './query'
import { sharedState } from './state'

export interface ParsedHash {
  segments: string[]
  params: URLSearchParams
}

export type Route =
  | { kind: 'course' }
  | { kind: 'lab'; lab: LabDefinition }
  // Tools of one lab have different state types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { kind: 'tool'; lab: LabDefinition; tool: ToolDefinition<any> }

/** `#/<lab>/<tool>?a=1` -> `{ segments: ['<lab>', '<tool>'], params }`; leading/trailing slashes are trimmed. */
export function parseHash(hash: string): ParsedHash {
  const body = hash.replace(/^#/, '')
  const q = body.indexOf('?')
  const path = q >= 0 ? body.slice(0, q) : body
  const params = new URLSearchParams(q >= 0 ? body.slice(q + 1) : '')
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return { segments: trimmed === '' ? [] : trimmed.split('/'), params }
}

/**
 * Maps an address onto the course: unknown lab -> course home, known lab + unknown tool -> lab home, more than two
 * segments -> course home; all three set `unknownRoute`.
 */
export function resolveRoute(course: CourseDefinition, parsed: ParsedHash): { route: Route; unknownRoute: boolean } {
  const [labId, toolId] = parsed.segments
  if (labId === undefined) return { route: { kind: 'course' }, unknownRoute: false }
  if (parsed.segments.length > 2) return { route: { kind: 'course' }, unknownRoute: true }
  const lab = course.labs.find((l) => l.id === labId)
  if (!lab) return { route: { kind: 'course' }, unknownRoute: true }
  if (toolId === undefined) return { route: { kind: 'lab', lab }, unknownRoute: false }
  const tool = lab.tools.find((t) => t.id === toolId)
  if (!tool) return { route: { kind: 'lab', lab }, unknownRoute: true }
  return { route: { kind: 'tool', lab, tool }, unknownRoute: false }
}

/** `#/`, `#/<lab>`, `#/<lab>/<tool>`, each with `?<params>` when there are any. A tool without a lab is ignored. */
export function buildHash(target: { lab?: string; tool?: string }, params?: Query): string {
  const path = target.lab ? (target.tool ? `#/${target.lab}/${target.tool}` : `#/${target.lab}`) : '#/'
  const qs = params ? new URLSearchParams(params).toString() : ''
  return qs ? `${path}?${qs}` : path
}

/** Whether two hashes name the same address: same segments and the same parameters, in any order. */
export function sameHash(a: string, b: string): boolean {
  const pa = parseHash(a)
  const pb = parseHash(b)
  if (pa.segments.length !== pb.segments.length || pa.segments.some((s, i) => s !== pb.segments[i])) return false
  const key = (p: URLSearchParams) =>
    [...p.entries()]
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .sort()
      .join('&')
  return key(pa.params) === key(pb.params)
}

/** Whether the address names exactly this tool of this lab (internal helper of the views' adoption logic). */
export function routeNames(parsed: ParsedHash, labId: string, toolId: string): boolean {
  return parsed.segments.length === 2 && parsed.segments[0] === labId && parsed.segments[1] === toolId
}

// The route ref lives in the shared state (like the language ref), so a duplicated lab-kit copy shares it.
// Created on first access, never at import time; the hashchange listener is installed once per shared state.
const router = sharedState('router', () => ({
  current: shallowRef<ParsedHash>(parseHash(typeof window !== 'undefined' ? window.location.hash : '')),
  listening: false,
}))

function listen(): void {
  if (router.listening || typeof window === 'undefined') return
  router.listening = true
  window.addEventListener('hashchange', () => {
    router.current.value = parseHash(window.location.hash)
  })
}

export function useRoute(): Ref<ParsedHash> {
  listen()
  return router.current
}

/**
 * Re-reads the live address into a new route object, so route watchers fire as on `hashchange`. Used when the
 * target address equals the current one (re-applying a scenario), where assigning `location.hash` fires nothing.
 */
export function refreshRoute(): void {
  if (typeof window === 'undefined') return
  listen()
  router.current.value = parseHash(window.location.hash)
}
