import type { Point } from '../core/fit'

export type LineJob = { kind: 'bootstrap'; points: Point[]; B: number; seed: number }
