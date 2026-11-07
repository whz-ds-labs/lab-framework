import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, shallowRef } from 'vue'
import { mount } from '@vue/test-utils'
import { registerMessages, setLang, type ScenarioApi, type ScenarioDef } from '@whz-ds-labs/lab-kit'
import { installKitMessages } from '../src/kitMessages'
import ScenarioArea from '../src/ScenarioArea.vue'
import { alpha, demoLab } from './fixtures/demoLab'

beforeEach(() => {
  installKitMessages()
  registerMessages('demo', demoLab.messages)
  window.location.hash = ''
  setLang('de')
})

function fakeApi(deviatedNow: boolean): ScenarioApi {
  const active = shallowRef<ScenarioDef | null>(alpha.scenarios[1] as ScenarioDef)
  const deviated = shallowRef(deviatedNow)
  return {
    active,
    deviated: computed(() => active.value !== null && deviated.value),
    problems: shallowRef([]),
    apply: vi.fn(),
    dismiss: vi.fn(() => {
      active.value = null
    }),
    restore: vi.fn(() => {
      deviated.value = false
    }),
  }
}

describe('ScenarioArea focus', () => {
  it('moves the focus from the closed note to the card of that scenario', async () => {
    const w = mount(ScenarioArea, {
      props: { labId: 'demo', tool: alpha, scenario: fakeApi(false) },
      attachTo: document.body,
    })
    ;(w.find('[data-action="close"]').element as HTMLElement).focus()
    await w.find('[data-action="close"]').trigger('click')
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(w.find('button[data-scenario="a2"]').element)
    w.unmount()
  })

  it('moves the focus to the note title after restore removed the button', async () => {
    const w = mount(ScenarioArea, {
      props: { labId: 'demo', tool: alpha, scenario: fakeApi(true) },
      attachTo: document.body,
    })
    ;(w.find('[data-action="restore"]').element as HTMLElement).focus()
    await w.find('[data-action="restore"]').trigger('click')
    await w.vm.$nextTick()
    expect(w.find('[data-action="restore"]').exists()).toBe(false)
    const title = w.find('h3.note-title')
    expect(title.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(title.element)
    w.unmount()
  })

  it('forwards a card click to scenario.apply', async () => {
    const api = fakeApi(false)
    const w = mount(ScenarioArea, { props: { labId: 'demo', tool: alpha, scenario: api } })
    await w.find('button[data-scenario="a1"]').trigger('click')
    expect(api.apply).toHaveBeenCalledWith(alpha.scenarios[0])
  })
})
