import type { ScenarioDef } from '@whz-ds-labs/lab-kit'

// Ready-made states for the scenario bar. The numbers in the texts are proven in tests/unit/scenarioClaims.test.ts.
export const scenarios: ScenarioDef[] = [
  // Few, noisy points: the slope is unstable.
  { id: 's1', query: { n: '8', noise: '3' } },
  // One outlier at (9, -3) pulls the line; the bootstrap interval is computed on arrival.
  { id: 's2', query: { pts: '9:-3' }, action: 'bootstrap' },
]
