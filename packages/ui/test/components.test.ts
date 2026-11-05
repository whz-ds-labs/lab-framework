import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import { dismissNotice, notify, setLang, useNotices } from '@whz-ds-labs/lab-kit'
import { installKitMessages } from '../src/kitMessages'
import BarList from '../src/BarList.vue'
import Formula from '../src/Formula.vue'
import GridLayer from '../src/GridLayer.vue'
import LinearSlider from '../src/LinearSlider.vue'
import PlotFrame from '../src/PlotFrame.vue'
import PointLayer from '../src/PointLayer.vue'
import RefBadge from '../src/RefBadge.vue'
import RegionLayer from '../src/RegionLayer.vue'
import RootSlider from '../src/RootSlider.vue'
import StatusPanel from '../src/StatusPanel.vue'
import UrlNotice from '../src/UrlNotice.vue'
import * as ui from '../src/index'

const frameProps = { xDomain: [0, 1] as [number, number], yDomain: [0, 1] as [number, number], xLabel: 'x', yLabel: 'y' }

function inFrame(layer: ReturnType<typeof h>) {
  return mount(PlotFrame, { props: frameProps, slots: { default: () => layer } })
}

beforeEach(() => {
  installKitMessages()
  setLang('de')
  for (const n of [...useNotices().value]) dismissNotice(n.id)
})

describe('exports', () => {
  it('exports every building block from the index', () => {
    for (const name of [
      'PlotFrame', 'PointLayer', 'GridLayer', 'RegionLayer', 'LinearSlider', 'RootSlider',
      'BarList', 'Formula', 'StatusPanel', 'UrlNotice', 'RefBadge',
      'ScenarioBar', 'ScenarioNote', 'ScenarioArea', 'HelpDrawer',
    ]) {
      expect(ui, name).toHaveProperty(name)
    }
  })
})

describe('plot components', () => {
  it('PlotFrame renders an svg with a verify contract and forwards the default slot', () => {
    const w = mount(PlotFrame, { props: frameProps, slots: { default: '<circle data-test="slot" />' } })
    expect(w.find('svg').attributes('data-verify-unit')).toBe('plot-frame')
    expect(w.find('svg').attributes('data-verify-state')).toBe('ready')
    expect(w.find('[data-test="slot"]').exists()).toBe(true)
  })

  it('PointLayer draws one hit target per point and labels it in the current language', () => {
    const w = inFrame(h(PointLayer, { x: [0.2, 0.8], y: [0.3, 0.7] }))
    expect(w.findAll('[data-layer="point"]')).toHaveLength(2)
    expect(w.find('[data-layer="point"]').attributes('aria-label')).toBe('Punkt 1')
  })

  it('PointLayer emits point-remove on Delete', async () => {
    const w = inFrame(h(PointLayer, { x: [0.5], y: [0.5] }))
    await w.find('[data-layer="point"]').trigger('keydown', { key: 'Delete' })
    expect(w.findComponent(PointLayer).emitted('point-remove')?.[0]).toEqual([0])
  })

  it('GridLayer renders a canvas inside the plot', () => {
    const w = inFrame(h(GridLayer, { grid: new Float64Array(4 * 2), G: 2, nClasses: 2, colors: ['#ff0000', '#0000ff'] }))
    expect(w.find('[data-layer="grid"] canvas').exists()).toBe(true)
  })

  it('GridLayer accepts bounds as { xMin, xMax, yMin, yMax }', () => {
    const w = inFrame(
      h(GridLayer, {
        grid: new Float64Array(8),
        G: 2,
        nClasses: 2,
        colors: ['#f00', '#00f'],
        bounds: { xMin: 0, xMax: 0.5, yMin: 0, yMax: 0.5 },
      }),
    )
    const fo = w.find('[data-layer="grid"]')
    expect(Number(fo.attributes('width'))).toBeGreaterThan(0)
    expect(Number(fo.attributes('width'))).toBeLessThan(Number(w.find('.capture').attributes('width')))
  })

  it('RegionLayer draws one rect per region', () => {
    const regions = [
      { x0: 0, x1: 0.5, y0: 0, y1: 1, proba: [1, 0] },
      { x0: 0.5, x1: 1, y0: 0, y1: 1, proba: [0.2, 0.8] },
    ]
    const w = inFrame(h(RegionLayer, { regions, colors: ['#f00', '#00f'] }))
    expect(w.findAll('[data-region]')).toHaveLength(2)
  })
})

describe('sliders', () => {
  it('RootSlider maps the position quadratically and rounds', async () => {
    const w = mount(RootSlider, { props: { modelValue: 0, min: 0, max: 1, label: 'alpha', decimals: 2 } })
    await w.find('input').setValue('0.5')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([0.25])
  })

  it('LinearSlider and RootSlider label their input', () => {
    const lin = mount(LinearSlider, { props: { modelValue: 1, min: 0, max: 2, step: 1, label: 'Tiefe' } })
    const root = mount(RootSlider, { props: { modelValue: 0.25, min: 0, max: 1, label: 'Alpha' } })
    expect(lin.find('label').text()).toBe('Tiefe')
    expect(root.find('label').text()).toBe('Alpha')
    expect(root.find('input').attributes('aria-valuetext')).toBe('0.25')
  })
})

describe('BarList', () => {
  it('shows bars with ready state and count', () => {
    const w = mount(BarList, { props: { items: [{ label: 'a', value: 0.25 }, { label: 'b', value: 0.75 }] } })
    expect(w.attributes('data-verify-unit')).toBe('bar-list')
    expect(w.attributes('data-verify-state')).toBe('ready')
    expect(w.attributes('data-verify-count')).toBe('2')
    expect(w.find('[data-bar="1"]').attributes('style')).toContain('75%')
  })

  it('shows the empty text for no items', () => {
    const w = mount(BarList, { props: { items: [] } })
    expect(w.attributes('data-verify-state')).toBe('empty')
    expect(w.text()).toBe('Keine Daten vorhanden.')
  })
})

describe('Formula', () => {
  it('renders TeX through katex', () => {
    const w = mount(Formula, { props: { tex: 'x^2' } })
    expect(w.find('.katex').exists()).toBe(true)
    expect(w.classes()).not.toContain('display')
    expect(mount(Formula, { props: { tex: 'x^2', display: true } }).classes()).toContain('display')
  })
})

describe('StatusPanel', () => {
  it.each(['loading', 'empty', 'ready', 'error'] as const)('carries the verify contract for %s', (state) => {
    const w = mount(StatusPanel, { props: { state, message: 'boom' }, slots: { default: '<p>content</p>' } })
    expect(w.attributes('data-verify-unit')).toBe('status')
    expect(w.attributes('data-verify-state')).toBe(state)
    if (state === 'error') expect(w.attributes('data-verify-error')).toBe('boom')
    else expect(w.attributes('data-verify-error')).toBeUndefined()
  })

  it('uses kit texts and the message', () => {
    expect(mount(StatusPanel, { props: { state: 'loading' } }).text()).toContain('Berechne')
    expect(mount(StatusPanel, { props: { state: 'empty' } }).text()).toContain('Keine Daten')
    const err = mount(StatusPanel, { props: { state: 'error', message: 'boom' } })
    expect(err.find('[role="alert"]').text()).toContain('boom')
  })

  it('renders the slot only when ready', () => {
    expect(mount(StatusPanel, { props: { state: 'ready' }, slots: { default: '<p>content</p>' } }).text()).toBe('content')
    expect(mount(StatusPanel, { props: { state: 'empty' }, slots: { default: '<p>content</p>' } }).text()).not.toContain('content')
  })

  it('shows progress while loading', () => {
    const w = mount(StatusPanel, { props: { state: 'loading', progress: { done: 3, total: 10 } } })
    expect(w.find('progress').attributes('value')).toBe('3')
    expect(w.find('progress').attributes('max')).toBe('10')
    expect(w.text()).toContain('3')
  })
})

describe('UrlNotice', () => {
  it('lists one line per problem parameter', () => {
    const w = mount(UrlNotice, { props: { problems: ['depth', 'alpha'] } })
    expect(w.attributes('data-verify-unit')).toBe('url-notice')
    expect(w.attributes('data-verify-count')).toBe('2')
    const items = w.findAll('li')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('depth')
    expect(items[1]!.text()).toContain('alpha')
  })

  it('is empty without problems or notices', () => {
    const w = mount(UrlNotice, { props: { problems: [] } })
    expect(w.attributes('data-verify-state')).toBe('empty')
    expect(w.find('[role="status"]').exists()).toBe(false)
  })

  it('renders global notices with full keys and lets the user dismiss them', async () => {
    notify('kit.notice.invalidUrl')
    const w = mount(UrlNotice, { props: { problems: [] } })
    expect(w.attributes('data-verify-state')).toBe('ready')
    expect(w.text()).toContain('Die Adresse enthält ungültige Angaben')
    await w.find('button').trigger('click')
    expect(useNotices().value).toHaveLength(0)
    expect(w.attributes('data-verify-state')).toBe('empty')
  })
})

describe('RefBadge', () => {
  it('switches text with the language', async () => {
    const w = mount(RefBadge, { props: { chapter: '87–94', code: '4.2' } })
    expect(w.text()).toBe('Lehrbuch Kap. 87–94 · Notebook Zelle 4.2')
    setLang('en')
    await w.vm.$nextTick()
    expect(w.text()).toBe('Textbook ch. 87–94 · Notebook cell 4.2')
  })

  it('omits the cell part without a code', () => {
    expect(mount(RefBadge, { props: { chapter: '3' } }).text()).toBe('Lehrbuch Kap. 3')
  })
})
