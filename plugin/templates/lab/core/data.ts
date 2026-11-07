import { createRng } from '@whz-ds-labs/lab-kit'
import type { Point } from './fit'

/** `n` points with x uniform in [0, 10) and y = 1 + 0.5 x + noise * N(0, 1); the same seed gives the same points. */
export function generatePoints(n: number, noise: number, seed: number): Point[] {
  const rng = createRng(seed)
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const x = 10 * rng.uniform()
    out.push({ x, y: 1 + 0.5 * x + noise * rng.normal() })
  }
  return out
}
