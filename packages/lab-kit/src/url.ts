/**
 * Writing the live address of a tool view (onboarding). Both functions use `history.replaceState`, which fires no
 * `hashchange` and so never touches the route ref (no view re-init, no scenario action).
 */
import type { ToolDefinition } from './define'
import type { Query } from './query'
import { scenarioById } from './scenarios'

function liveParams(): URLSearchParams {
  return new URLSearchParams(window.location.hash.split('?')[1] ?? '')
}

function replaceHash(hash: string): void {
  history.replaceState(history.state, '', hash)
}

/**
 * Replaces the live address with `#/<lab>/<tool>?<query>`, keeping `lang` of the live address and `scenario` only
 * when that id exists and belongs to `tool`. Without `window`/`history` it does nothing (the view still works).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function writeToolQuery(labId: string, tool: ToolDefinition<any>, query: Query): void {
  if (typeof window === 'undefined') return
  try {
    const live = liveParams()
    const next = new URLSearchParams(query)
    const l = live.get('lang')
    if (l) next.set('lang', l)
    const id = live.get('scenario')
    if (id !== null && scenarioById(tool, id) !== null) next.set('scenario', id)
    const qs = next.toString()
    replaceHash(`#/${labId}/${tool.id}${qs ? `?${qs}` : ''}`)
  } catch {
    /* history unavailable: the view still works */
  }
}

/** Removes `scenario` from the live address (replaceState); the path and all other parameters stay. */
export function removeScenarioParam(): void {
  if (typeof window === 'undefined') return
  try {
    const body = window.location.hash.replace(/^#/, '')
    const q = body.indexOf('?')
    if (q < 0) return
    const params = new URLSearchParams(body.slice(q + 1))
    if (!params.has('scenario')) return
    params.delete('scenario')
    const qs = params.toString()
    replaceHash(`#${body.slice(0, q)}${qs ? `?${qs}` : ''}`)
  } catch {
    /* history unavailable: the box still closes */
  }
}
