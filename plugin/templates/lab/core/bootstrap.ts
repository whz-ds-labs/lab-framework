import { LabError, createRng } from '@whz-ds-labs/lab-kit'
import { fitLine, type Point } from './fit'

/** Linear-interpolated percentile (p in [0, 1]) of an ascending array. */
function percentile(sorted: number[], p: number): number {
  const pos = p * (sorted.length - 1)
  const i = Math.floor(pos)
  const frac = pos - i
  const a = sorted[i]!
  const b = sorted[Math.min(i + 1, sorted.length - 1)]!
  return a + frac * (b - a)
}

/**
 * 95 % percentile interval (2.5 / 97.5) of the slope over `B` resamples with replacement.
 * A resample whose x are all equal is skipped and redrawn; after `10 * B` draws in total the call fails with
 * `LabError('DEGENERATE_X')`. Throws `TOO_FEW_POINTS` for fewer than two points and `BAD_PARAM` for a `B` that
 * is not a positive integer.
 */
export function bootstrapSlope(points: Point[], B: number, seed: number): { lo: number; hi: number } {
  if (!Number.isInteger(B) || B < 1) throw new LabError('BAD_PARAM', { param: 'B', value: B })
  const n = points.length
  if (n < 2) throw new LabError('TOO_FEW_POINTS', { n })
  const rng = createRng(seed)
  const slopes: number[] = []
  const maxDraws = 10 * B
  let draws = 0
  while (slopes.length < B) {
    if (draws >= maxDraws) throw new LabError('DEGENERATE_X', { draws })
    draws++
    const sample: Point[] = []
    for (let i = 0; i < n; i++) sample.push(points[rng.int(n)]!)
    try {
      slopes.push(fitLine(sample).slope)
    } catch (e) {
      if (e instanceof LabError && e.code === 'DEGENERATE_X') continue
      throw e
    }
  }
  slopes.sort((a, b) => a - b)
  return { lo: percentile(slopes, 0.025), hi: percentile(slopes, 0.975) }
}
