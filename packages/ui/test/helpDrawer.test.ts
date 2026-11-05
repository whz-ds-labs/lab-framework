import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { registerMessages, scenarioHref, setLang, translate } from '@whz-ds-labs/lab-kit'
import { installKitMessages } from '../src/kitMessages'
import HelpDrawer from '../src/HelpDrawer.vue'
import { alpha, beta, demoLab } from './fixtures/demoLab'

const tr = (key: string, params?: Record<string, string | number>) => translate('de', key, params)

beforeEach(() => {
  installKitMessages()
  registerMessages('demo', demoLab.messages)
  window.location.hash = ''
  setLang('de')
})

describe('HelpDrawer', () => {
  it('is hidden and empty while closed', () => {
    const w = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: false } })
    const root = w.find('[data-verify-unit="help"]')
    expect(root.attributes('hidden')).toBeDefined()
    expect(root.attributes('data-verify-state')).toBe('empty')
    expect(w.find('h2').exists()).toBe(false)
  })

  it('renders purpose, read and control headings and texts of the tool', () => {
    const w = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: true } })
    const root = w.find('[data-verify-unit="help"]')
    expect(root.attributes('data-verify-state')).toBe('ready')
    expect(root.attributes('data-verify-tool')).toBe('alpha')
    expect(w.find('h2').text()).toBe(tr('kit.help.heading', { tool: 'Alpha' }))
    expect(w.find('[data-help="purpose"]').text()).toContain(tr('demo.alpha.help.purpose'))
    const read = w.find('[data-help="read"] [data-help-key="plot"]')
    expect(read.find('strong').text()).toBe(tr('demo.alpha.plot.title'))
    expect(read.find('span').text()).toBe(tr('demo.alpha.help.read.plot'))
    const n = w.find('[data-help="controls"] [data-help-key="n"]')
    expect(n.find('strong').text()).toBe(tr('demo.alpha.n.label'))
    expect(n.find('span').text()).toBe(tr('demo.alpha.help.controls.n'))
  })

  it('shows a literal control label verbatim', () => {
    const w = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: true } })
    const mode = w.find('[data-help="controls"] [data-help-key="mode"]')
    expect(mode.find('strong').text()).toBe('a | b')
    expect(mode.find('span').text()).toBe(tr('demo.alpha.help.controls.mode'))
  })

  it('emits close on Escape and on the close button', async () => {
    const w = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: true } })
    await w.find('[data-verify-unit="help"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('close')).toHaveLength(1)
    await w.find('[data-action="help-close"]').trigger('click')
    expect(w.emitted('close')).toHaveLength(2)
  })

  it('links scenarios with the scenarioHref address and the scenario title', () => {
    const w = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: true } })
    const links = w.findAll('[data-help-scenario]')
    expect(links.map((l) => l.attributes('data-help-scenario'))).toEqual(['a1', 'a2'])
    expect(links[0]!.attributes('href')).toBe(scenarioHref('demo', alpha, alpha.scenarios[0]!, 'de'))
    expect(links[0]!.text()).toBe(tr('demo.scenario.a1.title'))
  })

  it('applies a scenario on click and stays open on a wide viewport', async () => {
    const w = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: true } })
    await w.find('[data-help-scenario="a1"]').trigger('click')
    // applyScenario keeps only a ?lang= that is already in the live address (none here)
    expect(window.location.hash).toBe(scenarioHref('demo', alpha, alpha.scenarios[0]!))
    expect(w.emitted('close')).toBeUndefined()
  })

  it('shows the course reference badge only when the tool has refs', () => {
    const withRefs = mount(HelpDrawer, { props: { labId: 'demo', tool: alpha, open: true } })
    expect(withRefs.find('[data-help="course"]').exists()).toBe(true)
    expect(withRefs.find('.ref-badge').text()).toContain('ch-1')
    const without = mount(HelpDrawer, { props: { labId: 'demo', tool: beta, open: true } })
    expect(without.find('.ref-badge').exists()).toBe(false)
    expect(without.find('[data-help="course"]').exists()).toBe(false)
    expect(without.find('[data-help="purpose"]').text()).toContain(tr('demo.beta.help.purpose'))
    expect(without.find('[data-help="scenarios"]').exists()).toBe(false)
  })
})
