/**
 * Self-contained demo lab for the lab-kit tests (copy of the lab-kit test fixture for the ui tests, so it only imports
 * from the public lab-kit modules): one lab `demo` with tools `alpha` (params `n`, `mode`) and `beta` (no params),
 * tool components as tiny render-function components, complete DE/EN messages per the key conventions.
 */
import { defineComponent, h } from 'vue'
import { defineCourse, defineLab, defineTool, formatNumber, parseEnum, parseNumber, type Query } from '@whz-ds-labs/lab-kit'

export interface AlphaState {
  n: number
  mode: 'a' | 'b'
}

const MODES = ['a', 'b'] as const
const ALPHA_DEFAULT: AlphaState = { n: 3, mode: 'a' }

export function parseAlpha(q: Query): { state: AlphaState; problems: string[] } {
  const problems: string[] = []
  const n = parseNumber(q, 'n', { min: 1, max: 10, integer: true }, ALPHA_DEFAULT.n, problems)
  const mode = parseEnum(q, 'mode', MODES, ALPHA_DEFAULT.mode, problems)
  return { state: { n, mode }, problems }
}

export function alphaToQuery(s: AlphaState): Query {
  const q: Query = {}
  if (s.n !== ALPHA_DEFAULT.n) q.n = formatNumber(s.n)
  if (s.mode !== ALPHA_DEFAULT.mode) q.mode = s.mode
  return q
}

const AlphaView = defineComponent({
  name: 'DemoAlpha',
  render: () => h('section', { 'data-verify-unit': 'demo-alpha', 'data-verify-state': 'ready' }, 'alpha'),
})
const BetaView = defineComponent({
  name: 'DemoBeta',
  render: () => h('section', { 'data-verify-unit': 'demo-beta', 'data-verify-state': 'ready' }, 'beta'),
})

export const alpha = defineTool<AlphaState>({
  id: 'alpha',
  title: { de: 'Alpha', en: 'Alpha' },
  summary: { de: 'Erstes Werkzeug', en: 'First tool' },
  component: AlphaView,
  parse: parseAlpha,
  toQuery: alphaToQuery,
  scenarios: [
    { id: 'a1', query: { n: '5' } },
    { id: 'a2', query: { mode: 'b' }, action: 'go' },
  ],
  help: {
    read: [{ key: 'plot', title: 'alpha.plot.title' }],
    controls: [
      { key: 'n', label: 'alpha.n.label' },
      { key: 'mode', label: { literal: 'a | b' } },
    ],
  },
  refs: { chapter: 'ch-1', code: 'alpha.ts' },
})

export const beta = defineTool<Record<string, never>>({
  id: 'beta',
  title: { de: 'Beta', en: 'Beta' },
  summary: { de: 'Zweites Werkzeug', en: 'Second tool' },
  component: BetaView,
  parse: () => ({ state: {}, problems: [] }),
  toQuery: () => ({}),
  scenarios: [],
  help: { read: [], controls: [] },
})

export const demoLab = defineLab({
  id: 'demo',
  title: { de: 'Demo-Labor', en: 'Demo lab' },
  summary: { de: 'Ein Labor zum Testen', en: 'A lab for testing' },
  tools: [alpha, beta],
  messages: {
    de: {
      alpha: {
        plot: { title: 'Grafik' },
        n: { label: 'Anzahl n' },
        help: {
          purpose: 'Zeigt n Werte im Modus a oder b.',
          read: { plot: 'Die Grafik zeigt die Werte.' },
          controls: { n: 'Regelt die Anzahl.', mode: 'Wählt den Modus.' },
        },
      },
      beta: { help: { purpose: 'Hat keine Parameter.' } },
      scenario: {
        a1: { title: 'Fünf Werte', short: 'n auf 5 gesetzt.', see: 'Fünf Werte.', watch: 'Die Anzahl.', next: 'Ändere n.' },
        a2: { title: 'Modus b', short: 'Modus b mit Start.', see: 'Modus b.', watch: 'Den Modus.', next: 'Wechsle zurück.' },
      },
    },
    en: {
      alpha: {
        plot: { title: 'Plot' },
        n: { label: 'Count n' },
        help: {
          purpose: 'Shows n values in mode a or b.',
          read: { plot: 'The plot shows the values.' },
          controls: { n: 'Sets the count.', mode: 'Picks the mode.' },
        },
      },
      beta: { help: { purpose: 'Has no parameters.' } },
      scenario: {
        a1: { title: 'Five values', short: 'n set to 5.', see: 'Five values.', watch: 'The count.', next: 'Change n.' },
        a2: { title: 'Mode b', short: 'Mode b with start.', see: 'Mode b.', watch: 'The mode.', next: 'Switch back.' },
      },
    },
  },
})

export const demoCourse = defineCourse({
  id: 'demo-course',
  title: { de: 'Demo-Kurs', en: 'Demo course' },
  lead: { de: 'Ein Kurs zum Testen.', en: 'A course for testing.' },
  labs: [demoLab],
  roadmap: [{ title: { de: 'Später', en: 'Later' }, note: { de: 'Folgt.', en: 'Follows.' } }],
})
