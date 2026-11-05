/**
 * Shared helpers of the per-tool URL parsers.
 *
 * Conventions
 * - A parser takes a plain `Record<string, string>` (views pass `Object.fromEntries(params)`), never throws, and
 *   returns `{ state, problems }`. Unknown parameters (e.g. `lang`) are ignored without a problem.
 * - Numbers are plain decimals with '.' (`-?\d+(\.\d+)?`); exponents, empty strings, `NaN`, `Infinity` and
 *   anything else unreadable fall back to the default. Integers are rounded, values outside the range clamped.
 * - Booleans are `0` / `1`.
 * - Every correction (unreadable value, unknown enum, rounding, clamping) adds exactly one entry to `problems`.
 *   A problem is the name of the query parameter itself; the notice component maps it to a message.
 * - `toQuery` omits parameters that equal their default, so default states give the empty query.
 */

export type Query = Record<string, string>

const DECIMAL = /^-?\d+(\.\d+)?$/

function has(q: Query, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(q, key)
}

export function parseEnum<T extends string>(
  q: Query,
  key: string,
  allowed: readonly T[],
  def: T,
  problems: string[],
): T {
  if (!has(q, key)) return def
  const v = q[key]!
  if ((allowed as readonly string[]).includes(v)) return v as T
  problems.push(key)
  return def
}

/** Reads a decimal; an absent parameter gives `def` silently, an unreadable one gives `def` and a problem. */
export function parseNumber(
  q: Query,
  key: string,
  range: { min: number; max: number; integer?: boolean },
  def: number,
  problems: string[],
): number {
  if (!has(q, key)) return def
  const raw = q[key]!
  if (!DECIMAL.test(raw)) {
    problems.push(key)
    return def
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    problems.push(key)
    return def
  }
  const rounded = range.integer ? Math.round(parsed) : parsed
  const clamped = Math.min(range.max, Math.max(range.min, rounded))
  if (clamped !== parsed) problems.push(key)
  return clamped
}

/** `0` / `1` booleans. */
export function parseBool(q: Query, key: string, def: boolean, problems: string[]): boolean {
  if (!has(q, key)) return def
  if (q[key] === '1') return true
  if (q[key] === '0') return false
  problems.push(key)
  return def
}

/** Plain decimal without exponent, so the URL stays readable and `parseNumber` accepts it. */
export function formatNumber(v: number): string {
  const s = String(v)
  if (!/e/i.test(s)) return s
  return v.toFixed(18).replace(/0+$/, '').replace(/\.$/, '')
}
