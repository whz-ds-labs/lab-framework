// Not `new URL('../golden/', import.meta.url)`: in the happy-dom environment Vite rewrites that pattern into a dev-server URL.
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadGolden } from '@whz-ds-labs/lab-kit/testing'
import { describe, expect, it } from 'vitest'
import { bootstrapSlope } from '../../core/bootstrap'
import type { Point } from '../../core/fit'

const GOLDEN_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'golden')
const golden = loadGolden(GOLDEN_DIR, 'fit') as {
  cases: Record<string, { points: Point[] }>
}

describe('bootstrapSlope', () => {
  it('collapses to the true slope on the clean line', () => {
    const { lo, hi } = bootstrapSlope(golden.cases.clean!.points, 200, 1)
    // Resampled slopes of an exact line differ only by rounding error, so allow 1e-12 around 0.7.
    expect(lo).toBeLessThanOrEqual(0.7 + 1e-12)
    expect(hi).toBeGreaterThanOrEqual(0.7 - 1e-12)
    expect(hi - lo).toBeLessThan(1e-9)
  })

  it('is deterministic and ordered on the noisy set', () => {
    const pts = golden.cases.noisy!.points
    const a = bootstrapSlope(pts, 200, 3)
    expect(a).toEqual(bootstrapSlope(pts, 200, 3))
    expect(a.lo).toBeLessThan(a.hi)
  })

  it('fails when every resample has equal x', () => {
    const pts = [{ x: 1, y: 0 }, { x: 1, y: 1 }]
    expect(() => bootstrapSlope(pts, 10, 1)).toThrowError(expect.objectContaining({ code: 'DEGENERATE_X' }))
  })

  it('needs two points and a positive integer B', () => {
    expect(() => bootstrapSlope([{ x: 1, y: 0 }], 10, 1)).toThrowError(expect.objectContaining({ code: 'TOO_FEW_POINTS' }))
    expect(() => bootstrapSlope(golden.cases.clean!.points, 0, 1)).toThrowError(expect.objectContaining({ code: 'BAD_PARAM' }))
  })
})
