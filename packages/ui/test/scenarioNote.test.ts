import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { registerMessages, setLang, translate, type ScenarioDef } from '@whz-ds-labs/lab-kit'
import { installKitMessages } from '../src/kitMessages'
import ScenarioNote from '../src/ScenarioNote.vue'
import ScenarioBar from '../src/ScenarioBar.vue'
import { alpha, demoLab } from './fixtures/demoLab'

const a1 = alpha.scenarios[0] as ScenarioDef
const a2 = alpha.scenarios[1] as ScenarioDef
const tr = (lang: 'de' | 'en', key: string) => translate(lang, key)

beforeEach(() => {
  installKitMessages()
  registerMessages('demo', demoLab.messages)
  window.location.hash = ''
  setLang('de')
})

describe('ScenarioNote', () => {
  it('renders title and the three sections when ready', () => {
    const w = mount(ScenarioNote, { props: { labId: 'demo', scenario: a1, deviated: false } })
    const root = w.find('[data-verify-unit="scenario-note"]')
    expect(root.attributes('data-verify-state')).toBe('ready')
    expect(root.attributes('data-verify-deviated')).toBe('false')
    expect(root.attributes('hidden')).toBeUndefined()
    const text = w.text()
    expect(text).toContain(tr('de', 'demo.scenario.a1.title'))
    expect(text).toContain(tr('de', 'kit.scenario.noteSee'))
    expect(text).toContain(tr('de', 'demo.scenario.a1.see'))
    expect(text).toContain(tr('de', 'kit.scenario.noteWatch'))
    expect(text).toContain(tr('de', 'demo.scenario.a1.watch'))
    expect(text).toContain(tr('de', 'kit.scenario.noteNext'))
    expect(text).toContain(tr('de', 'demo.scenario.a1.next'))
    expect(w.find('[data-action="restore"]').exists()).toBe(false)
    // the box itself is no live region; a permanent sibling outside it announces only the title
    expect(root.find('[role="status"]').exists()).toBe(false)
    expect(root.attributes('aria-live')).toBeUndefined()
    const live = w.find('[role="status"]')
    expect(live.attributes('aria-live')).toBe('polite')
    expect(live.attributes('aria-atomic')).toBe('true')
    expect(live.classes()).toContain('sr-only')
    expect(live.text()).toBe(tr('de', 'demo.scenario.a1.title'))
  })

  it('shows the deviation hint with a restore button', async () => {
    const w = mount(ScenarioNote, { props: { labId: 'demo', scenario: a1, deviated: true } })
    expect(w.find('[data-verify-unit="scenario-note"]').attributes('data-verify-deviated')).toBe('true')
    expect(w.text()).toContain(tr('de', 'kit.scenario.changed'))
    expect(w.find('[role="status"]').text()).toBe(
      `${tr('de', 'demo.scenario.a1.title')} ${tr('de', 'kit.scenario.changed')}`,
    )
    const restore = w.find('[data-action="restore"]')
    expect(restore.text()).toBe(tr('de', 'kit.scenario.restore'))
    await restore.trigger('click')
    expect(w.emitted('restore')).toHaveLength(1)
  })

  it('emits close from the × button', async () => {
    const w = mount(ScenarioNote, { props: { labId: 'demo', scenario: a1, deviated: false } })
    const close = w.find('[data-action="close"]')
    expect(close.attributes('aria-label')).toBe(tr('de', 'kit.scenario.close'))
    await close.trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('keeps an empty, hidden root and the live region without a scenario', () => {
    const w = mount(ScenarioNote, { props: { labId: 'demo', scenario: null, deviated: false } })
    const root = w.find('[data-verify-unit="scenario-note"]')
    expect(root.exists()).toBe(true)
    expect(root.attributes('data-verify-state')).toBe('empty')
    expect(root.attributes('hidden')).toBeDefined()
    const live = w.find('[role="status"]')
    expect(live.exists()).toBe(true)
    expect(live.text()).toBe('')
    expect(root.find('[role="status"]').exists()).toBe(false)
    expect(w.find('h3').exists()).toBe(false)
  })

  it('updates the announcement when a scenario arrives or the user deviates', async () => {
    const w = mount(ScenarioNote, { props: { labId: 'demo', scenario: null, deviated: false } })
    const live = w.find('[role="status"]')
    await w.setProps({ scenario: a1 })
    expect(w.find('[role="status"]').element).toBe(live.element)
    expect(live.text()).toBe(tr('de', 'demo.scenario.a1.title'))
    expect(w.find('[data-verify-unit="scenario-note"]').attributes('hidden')).toBeUndefined()
    await w.setProps({ deviated: true })
    expect(live.text()).toBe(`${tr('de', 'demo.scenario.a1.title')} ${tr('de', 'kit.scenario.changed')}`)
  })

  it('keeps the announcement on a language toggle and re-announces on a new scenario', async () => {
    const w = mount(ScenarioNote, { props: { labId: 'demo', scenario: a1, deviated: false } })
    const live = w.find('[role="status"]')
    expect(live.text()).toBe(tr('de', 'demo.scenario.a1.title'))
    setLang('en')
    await w.vm.$nextTick()
    expect(w.find('h3').text()).toBe(tr('en', 'demo.scenario.a1.title')) // the box follows the language
    expect(live.text()).toBe(tr('de', 'demo.scenario.a1.title')) // the live region does not announce again
    await w.setProps({ scenario: a2 })
    expect(live.text()).toBe(tr('en', 'demo.scenario.a2.title'))
  })
})

describe('ScenarioBar', () => {
  it('renders the scenarios as pressed/unpressed buttons and emits apply', async () => {
    const w = mount(ScenarioBar, { props: { labId: 'demo', scenarios: alpha.scenarios, activeId: 'a2' } })
    const root = w.find('[data-verify-unit="scenario-bar"]')
    expect(root.attributes('data-verify-state')).toBe('ready')
    expect(root.attributes('data-verify-count')).toBe('2')
    expect(root.attributes('role')).toBe('group')
    expect(root.attributes('aria-label')).toBe(tr('de', 'kit.scenario.barLabel'))
    const cards = w.findAll('button[data-scenario]')
    expect(cards.map((c) => c.attributes('data-scenario'))).toEqual(['a1', 'a2'])
    expect(cards.map((c) => c.attributes('aria-pressed'))).toEqual(['false', 'true'])
    expect(cards[0]!.text()).toContain(tr('de', 'demo.scenario.a1.title'))
    expect(cards[0]!.text()).toContain(tr('de', 'demo.scenario.a1.short'))
    await cards[1]!.trigger('click')
    expect(w.emitted('apply')).toEqual([[a2]])
  })

  it('reports the empty state without scenarios', () => {
    const w = mount(ScenarioBar, { props: { labId: 'demo', scenarios: [], activeId: null } })
    const root = w.find('[data-verify-unit="scenario-bar"]')
    expect(root.attributes('data-verify-state')).toBe('empty')
    expect(root.attributes('data-verify-count')).toBe('0')
  })
})
