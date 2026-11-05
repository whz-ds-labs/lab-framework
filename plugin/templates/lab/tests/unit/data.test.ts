import { expectClose } from '@whz-ds-labs/lab-kit/testing'
import { describe, expect, it } from 'vitest'
import { generatePoints } from '../../core/data'

describe('generatePoints', () => {
  it('lies on y = 1 + 0.5x without noise', () => {
    const pts = generatePoints(5, 0, 1)
    expect(pts).toHaveLength(5)
    expectClose(pts.map((p) => p.y), pts.map((p) => 1 + 0.5 * p.x), { atol: 1e-12 })
    for (const p of pts) expect(p.x >= 0 && p.x <= 10).toBe(true)
  })

  it('is deterministic per seed', () => {
    expect(generatePoints(10, 1, 7)).toEqual(generatePoints(10, 1, 7))
    expect(generatePoints(10, 1, 7)).not.toEqual(generatePoints(10, 1, 8))
  })
})
