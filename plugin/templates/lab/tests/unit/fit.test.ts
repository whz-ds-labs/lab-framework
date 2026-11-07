// Not `new URL('../golden/', import.meta.url)`: in the happy-dom environment Vite rewrites that pattern into a dev-server URL.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expectClose, loadGolden } from '@whz-ds-labs/lab-kit/testing'
import { describe, expect, it } from 'vitest'
import { fitLine, type Point } from '../../core/fit'

const GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'golden')
const golden = loadGolden(GOLDEN_DIR, 'fit') as {
  cases: Record<string, { intercept: number; slope: number; r2: number; points: Point[] }>
}

describe('fitLine', () => {
  for (const [name, c] of Object.entries(golden.cases)) {
    it(`matches scikit-learn on ${name}`, () => {
      const r = fitLine(c.points)
      expectClose([r.intercept, r.slope, r.r2], [c.intercept, c.slope, c.r2], { rtol: 1e-10, atol: 1e-12 })
    })
  }

  it('needs two points', () => {
    expect(() => fitLine([{ x: 1, y: 1 }])).toThrowError(expect.objectContaining({ code: 'TOO_FEW_POINTS' }))
    expect(() => fitLine([])).toThrowError(expect.objectContaining({ code: 'TOO_FEW_POINTS' }))
  })

  it('rejects equal x', () => {
    const pts = [0.1, 0.1, 0.1].map((x, i) => ({ x, y: i }))
    expect(() => fitLine(pts)).toThrowError(expect.objectContaining({ code: 'DEGENERATE_X' }))
  })

  it('gives R² = 1 for equal y', () => {
    const r = fitLine([{ x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }])
    expect(r.slope).toBe(0)
    expect(r.intercept).toBe(3)
    expect(r.r2).toBe(1)
  })

  it.each([3, 7])('gives R² = 1 for y = 0.1 with %i points (rounding noise in the centered sum)', (n) => {
    const r = fitLine(Array.from({ length: n }, (_, i) => ({ x: i, y: 0.1 })))
    expect(r.r2).toBe(1)
    expectClose(r.slope, 0, { atol: 1e-12 })
    expectClose(r.intercept, 0.1)
  })
})
