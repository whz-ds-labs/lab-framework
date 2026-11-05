import { defineTool } from '@whz-ds-labs/lab-kit'
import { topics } from '../help/topics'
import { scenarios } from '../scenarios'
import LineTool from './LineTool.vue'
import { parseLineQuery, toLineQuery, type LineState } from './state'

// No `refs` here: the chapter badge appears only with real chapter/cell numbers.
export const lineTool = defineTool<LineState>({
  id: 'line',
  title: { de: 'Ausgleichsgerade', en: 'Least squares line' },
  summary: {
    de: 'Eine Gerade durch eine Punktwolke legen und ihre Güte beurteilen.',
    en: 'Fit a line through a point cloud and judge how well it fits.',
  },
  component: LineTool,
  parse: parseLineQuery,
  toQuery: toLineQuery,
  scenarios,
  help: topics,
})
