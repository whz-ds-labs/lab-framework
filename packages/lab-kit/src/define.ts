import type { Component } from 'vue'
import type { Catalog } from './catalog'
import { LabError } from './errors'
import type { Lang, Localized } from './i18n'
import type { Query } from './query'

/** A ready-made tool state: the complete normalized query (defaults omitted) plus an optional one-off start action. */
export interface ScenarioDef {
  id: string
  query: Query
  action?: string
}

/**
 * Structure of a tool's help drawer. `title` / `label` are message keys relative to the lab scope that name the
 * panel's or control's own heading/label the tool already shows (e.g. `line.plot.title`); `{ literal }` is shown
 * verbatim (no lookup). The explanatory text lives at `<toolId>.help.read.<key>` / `<toolId>.help.controls.<key>`.
 */
export interface HelpTopics {
  read: { key: string; title: string }[]
  controls: { key: string; label: string | { literal: string } }[]
}

export interface ToolDefinition<S = unknown> {
  id: string
  title: Localized
  summary: Localized
  component: Component
  /** Never throws; every correction adds one entry (the parameter name) to `problems`. */
  parse(q: Query): { state: S; problems: string[] }
  /** Omits parameters that equal their default. */
  toQuery(s: S): Query
  scenarios: ScenarioDef[]
  help: HelpTopics
  refs?: { chapter: string; code: string }
}

export interface LabDefinition {
  id: string
  title: Localized
  summary: Localized
  // A lab lists tools with different state types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: ToolDefinition<any>[]
  messages: Record<Lang, Catalog>
}

export interface CourseDefinition {
  id: string
  title: Localized
  lead: Localized
  labs: LabDefinition[]
  roadmap: { title: Localized; note?: Localized }[]
}

const ID = /^[a-z][a-z0-9-]{1,40}$/

function bad(reason: string, id: string): never {
  throw new LabError('BAD_DEFINITION', { reason, id }, `BAD_DEFINITION: ${reason} (${id})`)
}

function checkId(kind: string, id: unknown): void {
  if (typeof id !== 'string' || !ID.test(id)) bad(`${kind} id must match ${ID}`, String(id))
}

function checkUnique(kind: string, scope: string, ids: string[]): void {
  const seen = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) bad(`duplicate ${kind} id in ${scope}`, id)
    seen.add(id)
  }
}

function sameQuery(a: Query, b: Query): boolean {
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && a[k] === b[k])
}

/** Validates a tool definition (ids, unique scenario ids, normalized scenario queries) and returns it unchanged. */
export function defineTool<S>(t: ToolDefinition<S>): ToolDefinition<S> {
  checkId('tool', t.id)
  checkUnique('scenario', `tool ${t.id}`, t.scenarios.map((s) => s.id))
  for (const s of t.scenarios) {
    checkId('scenario', s.id)
    const parsed = t.parse(s.query)
    if (parsed.problems.length > 0) {
      bad(`scenario query of tool ${t.id} has parse problems: ${parsed.problems.join(', ')}`, s.id)
    }
    if (!sameQuery(t.toQuery(parsed.state), s.query)) {
      bad(`scenario query of tool ${t.id} is not normalized (defaults must be omitted)`, s.id)
    }
  }
  return t
}

export function defineLab(l: LabDefinition): LabDefinition {
  checkId('lab', l.id)
  // "kit" is the message scope of the framework texts; a lab registering under it would replace them.
  if (l.id === 'kit') bad('lab id "kit" is reserved for the framework message scope', l.id)
  for (const t of l.tools) checkId('tool', t.id)
  checkUnique('tool', `lab ${l.id}`, l.tools.map((t) => t.id))
  return l
}

export function defineCourse(c: CourseDefinition): CourseDefinition {
  checkId('course', c.id)
  checkUnique('lab', `course ${c.id}`, c.labs.map((l) => l.id))
  return c
}
