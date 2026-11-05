/// <reference types="node" />
/** Node-only test helpers (no vue, no DOM): golden files, numeric comparison and message-catalog checks. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { catalogKeys, lookup, placeholderNames, type Catalog } from '../catalog'
import type { LabDefinition } from '../define'

/** Parses `<dir>/<name>.json` (e.g. produced by a Python golden script). `dir` is a path or a `file:` URL. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadGolden(dir: string | URL, name: string): any {
  const base = typeof dir === 'string' ? dir : fileURLToPath(dir)
  return JSON.parse(readFileSync(join(base, `${name}.json`), 'utf8'))
}

export interface Tolerance {
  rtol?: number
  atol?: number
}

/**
 * Passes when `|a - e| <= atol + rtol * |e|` for every element (defaults rtol 1e-9, atol 1e-12).
 * Throws an Error naming index, actual, expected and tolerance; NaN never passes; lengths must match.
 */
export function expectClose(actual: number | number[], expected: number | number[], tol: Tolerance = {}): void {
  const rtol = tol.rtol ?? 1e-9
  const atol = tol.atol ?? 1e-12
  const aIsArr = Array.isArray(actual)
  const eIsArr = Array.isArray(expected)
  if (aIsArr !== eIsArr) {
    throw new Error(`expectClose: shape mismatch (actual is ${aIsArr ? 'an array' : 'a number'}, expected is ${eIsArr ? 'an array' : 'a number'})`)
  }
  const a = aIsArr ? actual : [actual]
  const e = eIsArr ? expected : [expected]
  if (a.length !== e.length) {
    throw new Error(`expectClose: length mismatch (actual ${a.length}, expected ${e.length})`)
  }
  for (let i = 0; i < a.length; i++) {
    const av = a[i]!
    const ev = e[i]!
    if (!(Math.abs(av - ev) <= atol + rtol * Math.abs(ev))) {
      throw new Error(
        `expectClose: index ${i}: actual ${av}, expected ${ev}, |diff| ${Math.abs(av - ev)} > atol ${atol} + rtol ${rtol} * |expected|`,
      )
    }
  }
}

/** Human-readable lines for keys missing in either language and for keys whose placeholder sets differ. */
export function catalogParity(de: Catalog, en: Catalog): string[] {
  const out: string[] = []
  const deKeys = catalogKeys(de)
  const enKeys = new Set(catalogKeys(en))
  for (const k of deKeys) {
    if (!enKeys.has(k)) out.push(`missing in en: ${k}`)
  }
  const deSet = new Set(deKeys)
  for (const k of enKeys) {
    if (!deSet.has(k)) out.push(`missing in de: ${k}`)
  }
  for (const k of deKeys) {
    const a = lookup(de, k)
    const b = lookup(en, k)
    if (a === undefined || b === undefined) continue
    const pa = [...placeholderNames(a)].sort()
    const pb = [...placeholderNames(b)].sort()
    if (pa.join(',') !== pb.join(',')) {
      out.push(`placeholder mismatch: ${k} (de: {${pa.join(', ')}}, en: {${pb.join(', ')}})`)
    }
  }
  return out
}

/** Every message key the lab's definitions require (relative to the lab scope), literals skipped. */
function requiredKeys(lab: LabDefinition): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  const add = (k: string) => {
    if (!seen.has(k)) {
      seen.add(k)
      keys.push(k)
    }
  }
  for (const tool of lab.tools) {
    for (const s of tool.scenarios) {
      for (const part of ['title', 'short', 'see', 'watch', 'next']) add(`scenario.${s.id}.${part}`)
    }
    add(`${tool.id}.help.purpose`)
    for (const r of tool.help.read) {
      add(`${tool.id}.help.read.${r.key}`)
      add(r.title)
    }
    for (const c of tool.help.controls) {
      add(`${tool.id}.help.controls.${c.key}`)
      if (typeof c.label === 'string') add(c.label)
    }
  }
  return keys
}

/** Lines `<lang>: <labId>.<key>` for each required key missing in DE or EN. */
export function missingLabMessages(lab: LabDefinition): string[] {
  const out: string[] = []
  const keys = requiredKeys(lab)
  for (const lang of ['de', 'en'] as const) {
    for (const k of keys) {
      if (lookup(lab.messages[lang], k) === undefined) out.push(`${lang}: ${lab.id}.${k}`)
    }
  }
  return out
}
