// @vitest-environment node
// (happy-dom replaces the URL class, which loadGolden cannot turn into a file path)
import { expectClose, loadGolden } from '@whz-ds-labs/lab-kit/testing'
import { describe, it } from 'vitest'
import { fitLine, type Point } from '../../core/fit'

// The oracle is golden/make_golden.py (scikit-learn); `npm run golden` regenerates the JSON.
const golden = loadGolden(new URL('../golden/', import.meta.url), 'fit') as {
  cases: Record<string, { intercept: number; slope: number; r2: number; points: Point[] }>
}

describe('golden: fitLine vs scikit-learn LinearRegression', () => {
  for (const [name, c] of Object.entries(golden.cases)) {
    it(name, () => {
      const r = fitLine(c.points)
      const tol = { rtol: 1e-10, atol: 1e-12 }
      expectClose(r.intercept, c.intercept, tol)
      expectClose(r.slope, c.slope, tol)
      expectClose(r.r2, c.r2, tol)
    })
  }
})
