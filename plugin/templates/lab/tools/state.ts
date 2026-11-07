import { formatNumber, parseNumber, type Query } from '@whz-ds-labs/lab-kit'
import type { Point } from '../core/fit'

export type LineState = { n: number; noise: number; seed: number; pts: Point[] }

export const MAX_PTS = 30
export const X_RANGE = { min: 0, max: 10 }
export const Y_RANGE = { min: -5, max: 15 }
const DECIMAL = '-?\\d+(?:\\.\\d+)?'
const PAIR = new RegExp(`^(${DECIMAL}):(${DECIMAL})$`)

function round2(v: number): number {
  const r = Math.round(v * 100) / 100
  return r === 0 ? 0 : r // no "-0"
}

/** Parses `x:y,x:y`; null when anything is unreadable, out of range or more than MAX_PTS pairs. */
function parsePts(raw: string): Point[] | null {
  const parts = raw.split(',')
  if (parts.length > MAX_PTS) return null
  const out: Point[] = []
  for (const part of parts) {
    const m = PAIR.exec(part)
    if (!m) return null
    const x = round2(Number(m[1]))
    const y = round2(Number(m[2]))
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    if (x < X_RANGE.min || x > X_RANGE.max || y < Y_RANGE.min || y > Y_RANGE.max) return null
    out.push({ x, y })
  }
  return out
}

/** Never throws. Any invalid pair drops the whole `pts` and reports `'pts'` once. Rounding to 2 decimals is silent. */
export function parseLineQuery(q: Query): { state: LineState; problems: string[] } {
  const problems: string[] = []
  const n = parseNumber(q, 'n', { min: 3, max: 200, integer: true }, 20, problems)
  const noise = parseNumber(q, 'noise', { min: 0, max: 5 }, 1, problems)
  const seed = parseNumber(q, 'seed', { min: 0, max: 9999, integer: true }, 1, problems)
  let pts: Point[] = []
  if (Object.prototype.hasOwnProperty.call(q, 'pts')) {
    const parsed = parsePts(q.pts!)
    if (parsed) pts = parsed
    else problems.push('pts')
  }
  return { state: { n, noise, seed, pts }, problems }
}

/** Omits parameters that equal their default. */
export function toLineQuery(s: LineState): Query {
  const q: Query = {}
  if (s.n !== 20) q.n = formatNumber(s.n)
  if (s.noise !== 1) q.noise = formatNumber(s.noise)
  if (s.seed !== 1) q.seed = formatNumber(s.seed)
  if (s.pts.length > 0) q.pts = s.pts.map((p) => `${formatNumber(round2(p.x))}:${formatNumber(round2(p.y))}`).join(',')
  return q
}
