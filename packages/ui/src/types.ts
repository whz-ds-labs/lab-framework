/** Rectangle in data coordinates (e.g. the extent of a generated dataset). */
export type Bounds = { xMin: number; xMax: number; yMin: number; yMax: number }

/** Leaf rectangle of a tree with the class probabilities inside it (structural copy of the DT region type). */
export interface Region {
  x0: number
  x1: number
  y0: number
  y1: number
  proba: number[]
}
