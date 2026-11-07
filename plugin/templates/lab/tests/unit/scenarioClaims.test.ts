import { fmt, lookup, type Lang } from '@whz-ds-labs/lab-kit'
import { describe, expect, it } from 'vitest'
import { bootstrapSlope } from '../../core/bootstrap'
import { generatePoints } from '../../core/data'
import { fitLine } from '../../core/fit'
import { lab } from '../../lab'
import { scenarios } from '../../scenarios'
import { parseLineQuery } from '../../tools/state'

// Every number a scenario text states is computed here from the same code the tool runs (B = 1000 like the button).
const B = 1000

function analyze(query: Record<string, string>) {
  const { state, problems } = parseLineQuery(query)
  expect(problems).toEqual([])
  const pts = [...generatePoints(state.n, state.noise, state.seed), ...state.pts]
  const f = fitLine(pts)
  const ci = bootstrapSlope(pts, B, state.seed)
  return { state, pts, ...f, ci, width: ci.hi - ci.lo }
}

const scenario = (id: string) => scenarios.find((s) => s.id === id)!
const text = (lang: Lang, id: string, part: string) => lookup(lab.messages[lang], `scenario.${id}.${part}`) ?? ''
const allText = (lang: Lang, id: string) => ['title', 'short', 'see', 'watch', 'next'].map((p) => text(lang, id, p)).join(' ')
const base = analyze({})

const r2d = (v: number): number => Number(v.toFixed(2))
/** Every number in a text (decimal comma or point, optional minus sign), as numbers. */
function numbersIn(text: string): number[] {
  return [...text.matchAll(/[-−]?\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace('−', '-').replace(',', '.')))
}
/** Fails for any number of the scenario texts (DE and EN) that is not in the proven set. */
function expectOnlyProven(id: string, proven: number[]): void {
  const allowed = new Set(proven.map(r2d))
  for (const lang of ['de', 'en'] as const) {
    for (const part of ['title', 'short', 'see', 'watch', 'next']) {
      for (const n of numbersIn(text(lang, id, part))) {
        expect(allowed.has(n), `${lang} scenario.${id}.${part} states ${n}, not in the proven set ${[...allowed].join(', ')}`).toBe(true)
      }
    }
  }
}

describe('scenario definitions', () => {
  it('has s1 and s2 with the documented queries and actions', () => {
    expect(scenarios.map((s) => s.id)).toEqual(['s1', 's2'])
    expect(scenario('s1')).toEqual({ id: 's1', query: { n: '8', noise: '3' } })
    expect(scenario('s2')).toEqual({ id: 's2', query: { pts: '9:-3' }, action: 'bootstrap' })
  })
})

describe('s1: few noisy points give an unstable slope', () => {
  const s1 = analyze(scenario('s1').query)

  it('proves the claims', () => {
    expect(s1.pts).toHaveLength(8)
    // The generating slope is 0.5; the estimate is far off and R² is tiny.
    expect(Math.abs(s1.slope - 0.5)).toBeGreaterThan(0.1)
    expect(s1.r2).toBeLessThan(0.1)
    // The interval is huge compared with the default view and contains 0: the data do not even show the sign of the slope.
    expect(s1.ci.lo).toBeLessThan(0)
    expect(s1.ci.hi).toBeGreaterThan(1)
    expect(s1.width).toBeGreaterThan(5 * base.width)
  })

  for (const lang of ['de', 'en'] as const) {
    it(`states only proven numbers (${lang})`, () => {
      const t = allText(lang, 's1')
      for (const v of [0.5, s1.slope, s1.r2, s1.ci.lo, s1.ci.hi, base.width]) expect(t).toContain(fmt(lang, v, v === 0.5 ? 1 : 2))
    })
  }
})

describe('numbersIn', () => {
  it('keeps the sign of U+2212 and decimal commas', () => {
    expect(numbersIn('−0,34 und -0.5 sowie 8')).toEqual([-0.34, -0.5, 8])
  })
})

describe('s1: no number outside the proven set', () => {
  it('every number in the texts is proven', () => {
    const s1 = analyze(scenario('s1').query)
    // inputs (n 8, noise 3), generating slope 0.5, 0 (sign of the slope), results and the default-view interval width
    expectOnlyProven('s1', [8, 3, 0, 0.5, s1.slope, s1.r2, s1.ci.lo, s1.ci.hi, base.width])
  })
})

describe('s2: one outlier pulls the line', () => {
  const s2 = analyze(scenario('s2').query)

  it('proves the claims', () => {
    expect(s2.pts).toHaveLength(21)
    // The outlier (9, -3) lies far below the line of the other points.
    expect(base.intercept + base.slope * 9 - -3).toBeGreaterThan(5)
    expect(s2.slope).toBeLessThan(base.slope - 0.1)
    expect(s2.r2).toBeLessThan(base.r2 / 2)
    expect(s2.width).toBeGreaterThan(2 * base.width)
    expect(s2.ci.lo).toBeLessThan(0)
  })

  for (const lang of ['de', 'en'] as const) {
    it(`states only proven numbers (${lang})`, () => {
      const t = allText(lang, 's2')
      const nums = [base.slope, base.r2, base.width, s2.slope, s2.r2, s2.width, s2.ci.lo]
      for (const v of nums) expect(t).toContain(fmt(lang, v, 2))
    })
  }
})

describe('s2: no number outside the proven set', () => {
  it('every number in the texts is proven', () => {
    const s2 = analyze(scenario('s2').query)
    // 20 default points, outlier (9, -3), 0 (sign), default-view and scenario results
    expectOnlyProven('s2', [20, 9, -3, 0, base.slope, base.r2, base.width, s2.slope, s2.r2, s2.width, s2.ci.lo])
  })
})
