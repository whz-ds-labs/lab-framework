import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { packageRoot } from './helpers/dist'

const css = readFileSync(join(packageRoot, 'tokens.css'), 'utf8')
const darkAt = css.indexOf('prefers-color-scheme: dark')

function declarations(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/(--ds-[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!.trim()
  return out
}

const light = declarations(css.slice(0, darkAt))
const dark = declarations(css.slice(darkAt))

/** Tokens that exist in both themes: [name, light, dark]. */
const themed: [string, string, string][] = [
  ['--ds-surface-page', '#f3f4f6', '#12161c'],
  ['--ds-surface-area', '#e9ecf1', '#1a1f27'],
  ['--ds-surface-card', '#ffffff', '#222833'],
  ['--ds-text', '#1b2230', '#e8edf5'],
  ['--ds-text-muted', '#4f596b', '#aab3c2'],
  ['--ds-accent', '#2b5c9e', '#7fb0ee'],
  ['--ds-accent-contrast', '#ffffff', '#12161c'],
  ['--ds-focus', '#b4530a', '#f5b062'],
  ['--ds-error', '#b3261e', '#f2877f'],
  ['--ds-error-bg', '#fdecea', '#3a1f1d'],
  ['--ds-ok', '#1d6b3a', '#6fcf97'],
  ['--ds-warn', '#8a5a00', '#e6c35c'],
  ['--ds-input-border', '#8a93a3', '#5b6577'],
  ['--ds-plot-axis', '#5b6577', '#8d97a8'],
  ['--ds-plot-grid', '#d9dde5', '#2c3442'],
  ['--ds-points', '#111827', '#ffffff'],
]

/** Theme-independent tokens (defined once under :root). */
const fixed: [string, string][] = [
  ['--ds-space-1', '0.25rem'],
  ['--ds-space-2', '0.5rem'],
  ['--ds-space-3', '0.75rem'],
  ['--ds-space-4', '1rem'],
  ['--ds-space-5', '1.5rem'],
  ['--ds-space-6', '2rem'],
  ['--ds-space-7', '3rem'],
  ['--ds-radius-s', '6px'],
  ['--ds-radius-m', '10px'],
  ['--ds-radius-l', '16px'],
  ['--ds-radius-pill', '999px'],
  ['--ds-font-s', '0.85rem'],
  ['--ds-font-m', '1rem'],
  ['--ds-font-l', '1.25rem'],
  ['--ds-font-xl', '1.6rem'],
  ['--ds-weight-regular', '400'],
  ['--ds-weight-strong', '600'],
  ['--ds-hit', '40px'],
]

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`not a #rrggbb colour: ${hex}`)
  const n = parseInt(m[1]!, 16)
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('design tokens v0', () => {
  it('has a dark block', () => {
    expect(darkAt).toBeGreaterThan(0)
  })

  it.each(themed)('%s exists in light and dark with the specified values', (name, l, d) => {
    expect(light[name], `light ${name}`).toBe(l)
    expect(dark[name], `dark ${name}`).toBe(d)
  })

  it.each(fixed)('%s = %s', (name, value) => {
    expect(light[name]).toBe(value)
  })

  it.each([0, 1, 2, 3, 4, 5])('defines --ds-class-%i as a hex colour in light and dark', (k) => {
    expect(light[`--ds-class-${k}`]).toMatch(/^#[0-9a-f]{6}$/)
    expect(dark[`--ds-class-${k}`]).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('keeps the six class colours distinct in each theme', () => {
    for (const theme of [light, dark]) {
      expect(new Set([0, 1, 2, 3, 4, 5].map((k) => theme[`--ds-class-${k}`])).size).toBe(6)
    }
  })

  describe.each([
    ['light', light],
    ['dark', dark],
  ] as const)('contrast (%s)', (_theme, t) => {
    const surfaces = ['--ds-surface-page', '--ds-surface-area', '--ds-surface-card'] as const

    it.each(surfaces)('--ds-text on %s is >= 4.5', (s) => {
      expect(contrast(t['--ds-text']!, t[s]!)).toBeGreaterThanOrEqual(4.5)
    })

    it.each(surfaces)('--ds-text-muted on %s is >= 4.5', (s) => {
      expect(contrast(t['--ds-text-muted']!, t[s]!)).toBeGreaterThanOrEqual(4.5)
    })

    it('--ds-accent on --ds-surface-card is >= 3', () => {
      expect(contrast(t['--ds-accent']!, t['--ds-surface-card']!)).toBeGreaterThanOrEqual(3)
    })
  })
})
