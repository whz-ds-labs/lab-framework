/**
 * Scenario helpers (onboarding): ready-made tool states with a short explanation. The scenarios themselves are data
 * on the `ToolDefinition`; the texts live in the lab's messages (`scenario.<scenarioId>.{title,short,see,watch,next}`).
 */
import type { ScenarioDef, ToolDefinition } from './define'
import type { Query } from './query'
import { buildHash } from './router'

/* eslint-disable @typescript-eslint/no-explicit-any -- helpers accept tools of any state type */

export function scenarioById(tool: ToolDefinition<any>, id: string): ScenarioDef | null {
  return tool.scenarios.find((s) => s.id === id) ?? null
}

/**
 * The scenario named by `q.scenario`: missing -> `null` without problem; unknown id or one of another tool ->
 * `null` with the problem `'scenario'`.
 */
export function parseScenarioParam(
  tool: ToolDefinition<any>,
  q: Query,
): { scenario: ScenarioDef | null; problems: string[] } {
  if (!Object.prototype.hasOwnProperty.call(q, 'scenario')) return { scenario: null, problems: [] }
  const s = scenarioById(tool, q.scenario!)
  if (s === null) return { scenario: null, problems: ['scenario'] }
  return { scenario: s, problems: [] }
}

/** `tool.toQuery(tool.parse(q).state)`: the query without defaults, unknown parameters (`scenario`, `lang`) dropped. */
export function normalizeToolQuery(tool: ToolDefinition<any>, q: Query): Query {
  return tool.toQuery(tool.parse(q).state)
}

/** Whether the normalized current state differs from the normalized scenario query. */
export function isDeviated(tool: ToolDefinition<any>, s: ScenarioDef, current: Query): boolean {
  const a = normalizeToolQuery(tool, current)
  const b = normalizeToolQuery(tool, s.query)
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) if (a[k] !== b[k]) return true
  return false
}

/** Address that applies the scenario (`#/<lab>/<tool>?<query>&scenario=<id>`), keeping the language when given. */
export function scenarioHref(labId: string, tool: ToolDefinition<any>, s: ScenarioDef, lang?: string): string {
  return buildHash({ lab: labId, tool: tool.id }, { ...s.query, scenario: s.id, ...(lang ? { lang } : {}) })
}
