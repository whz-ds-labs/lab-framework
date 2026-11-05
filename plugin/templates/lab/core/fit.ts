import { LabError } from '@whz-ds-labs/lab-kit'

export type Point = { x: number; y: number }

/**
 * Ordinary least squares line y = intercept + slope * x with the coefficient of determination.
 * Throws `LabError('TOO_FEW_POINTS')` for fewer than two points and `LabError('DEGENERATE_X')` when all x are equal.
 * All y equal gives `r2 = 1` (the line fits perfectly).
 */
export function fitLine(points: Point[]): { intercept: number; slope: number; r2: number } {
  const n = points.length
  if (n < 2) throw new LabError('TOO_FEW_POINTS', { n })
  const x0 = points[0]!.x
  // Compare the values themselves: a centered sum of squares of equal x would be rounding noise, not exactly 0.
  if (points.every((p) => p.x === x0)) throw new LabError('DEGENERATE_X', { n })

  let sx = 0
  let sy = 0
  for (const p of points) {
    sx += p.x
    sy += p.y
  }
  const mx = sx / n
  const my = sy / n
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const p of points) {
    const dx = p.x - mx
    const dy = p.y - my
    sxx += dx * dx
    sxy += dx * dy
    syy += dy * dy
  }
  const slope = sxy / sxx
  const intercept = my - slope * mx
  let ssRes = 0
  for (const p of points) {
    const e = p.y - (intercept + slope * p.x)
    ssRes += e * e
  }
  // Exact comparison, like for x: for y = 0.1 the centered sum syy is rounding noise (about 6e-34), not 0.
  const y0 = points[0]!.y
  const r2 = points.every((p) => p.y === y0) ? 1 : 1 - ssRes / syy
  return { intercept, slope, r2 }
}
