import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref, watch, type Ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { resetRoute, setHash, settle } from './helpers/browser'
import { defineTool, type ToolDefinition } from '../src/define'
import { useRoute } from '../src/router'
import { scenarioById } from '../src/scenarios'
import { removeScenarioParam, writeToolQuery } from '../src/url'
import { applyScenario, useScenario, type ScenarioApi } from '../src/useScenario'
import { alpha, beta } from './fixtures/demoLab'

// alpha plus a second scenario with an action, to navigate from one action scenario to another
const alt = defineTool({
  ...alpha,
  scenarios: [...alpha.scenarios, { id: 'a3', query: { n: '7', mode: 'b' }, action: 'go2' }],
})

let wrapper: VueWrapper | null = null

beforeEach(() => resetRoute())

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

interface Harness {
  api: ScenarioApi
  calls: string[]
  current: Ref<Record<string, string>>
}

/**
 * Mounts a stand-in view for `tool`: it adopts the route state in its own route watcher (registered AFTER
 * useScenario, the unfavourable order) and logs actions together with the state adopted at that moment.
 */
async function mountView(hash: string, tool: ToolDefinition<any> = alpha): Promise<Harness> {
  await setHash(hash)
  const calls: string[] = []
  const current = ref<Record<string, string>>({})
  let api!: ScenarioApi
  const View = defineComponent({
    setup() {
      const route = useRoute()
      const adopted = ref('')
      const adopt = () => {
        adopted.value = route.value.params.toString()
      }
      api = useScenario('demo', tool, () => current.value, (action) => calls.push(`${action}@${adopted.value}`))
      adopt()
      watch(() => route.value, adopt)
      return () => h('div')
    },
  })
  wrapper = mount(View)
  await settle()
  return { api, calls, current }
}

describe('useScenario', () => {
  it('runs the action once after setup, after the view adopted the address', async () => {
    const { api, calls } = await mountView('#/demo/alpha?scenario=a2')
    expect(api.active.value?.id).toBe('a2')
    expect(api.problems.value).toEqual([])
    expect(calls).toEqual(['go@scenario=a2'])
  })

  it('does not run the action again after writeToolQuery or removeScenarioParam', async () => {
    const { calls } = await mountView('#/demo/alpha?scenario=a2')
    writeToolQuery('demo', alpha, { n: '5' })
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?n=5&scenario=a2')
    removeScenarioParam()
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?n=5')
    expect(calls).toHaveLength(1)
  })

  it('re-runs the action when applying the identical address (refreshRoute)', async () => {
    const { api, calls } = await mountView('#/demo/alpha?mode=b&scenario=a2')
    api.apply(api.active.value!)
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?mode=b&scenario=a2')
    expect(calls).toEqual(['go@mode=b&scenario=a2', 'go@mode=b&scenario=a2'])
    api.restore()
    await settle()
    expect(calls).toHaveLength(3)
  })

  it('treats a reordered address as identical and keeps lang', async () => {
    const { api, calls } = await mountView('#/demo/alpha?scenario=a2&lang=en&mode=b')
    expect(calls).toHaveLength(1)
    api.restore()
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?scenario=a2&lang=en&mode=b')
    expect(calls).toHaveLength(2)
  })

  it('navigates to another scenario and runs its action once', async () => {
    const { api, calls } = await mountView('#/demo/alpha?scenario=a2&lang=en', alt)
    api.apply(scenarioById(alt, 'a3')!)
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?n=7&mode=b&scenario=a3&lang=en')
    expect(api.active.value?.id).toBe('a3')
    expect(calls).toEqual(['go@scenario=a2&lang=en', 'go2@n=7&mode=b&scenario=a3&lang=en'])
    // applying from outside the view (help drawer) behaves the same
    applyScenario('demo', alt, scenarioById(alt, 'a2')!)
    await settle()
    expect(calls).toHaveLength(3)
    expect(calls[2]).toBe('go@mode=b&scenario=a2&lang=en')
  })

  it('runs the action once when the address changes on the same route', async () => {
    const { api, calls } = await mountView('#/demo/alpha')
    expect(api.active.value).toBeNull()
    expect(calls).toEqual([])
    await setHash('#/demo/alpha?scenario=a2')
    expect(api.active.value?.id).toBe('a2')
    expect(calls).toEqual(['go@scenario=a2'])
  })

  it('runs no action for a scenario without one', async () => {
    const { api, calls } = await mountView('#/demo/alpha?n=5&scenario=a1')
    expect(api.active.value?.id).toBe('a1')
    expect(calls).toEqual([])
  })

  it('dismiss clears active, runs no action and scenario stays out of later writes', async () => {
    const { api, calls } = await mountView('#/demo/alpha?mode=b&scenario=a2')
    expect(calls).toHaveLength(1)
    api.dismiss()
    expect(api.active.value).toBeNull()
    expect(window.location.hash).toBe('#/demo/alpha?mode=b')
    writeToolQuery('demo', alpha, { n: '9' })
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?n=9')
    expect(api.active.value).toBeNull()
    expect(calls).toHaveLength(1) // no action after dismiss
  })

  it('does not run the action when dismissed before it is due', async () => {
    await setHash('#/demo/alpha?scenario=a2')
    const calls: string[] = []
    let api!: ScenarioApi
    wrapper = mount(
      defineComponent({
        setup() {
          api = useScenario('demo', alpha, () => ({}), (a) => calls.push(a))
          api.dismiss() // before the pending nextTick of the setup adoption
          return () => h('div')
        },
      }),
    )
    await settle()
    expect(calls).toEqual([])
  })

  it('does not run the action after the view is unmounted', async () => {
    await setHash('#/demo/alpha')
    const calls: string[] = []
    wrapper = mount(
      defineComponent({
        setup() {
          useScenario('demo', alpha, () => ({}), (a) => calls.push(a))
          return () => h('div')
        },
      }),
    )
    wrapper.unmount()
    wrapper = null
    await setHash('#/demo/alpha?scenario=a2')
    expect(calls).toEqual([])
  })

  it('reports an unknown or foreign scenario and runs nothing', async () => {
    const { api, calls } = await mountView('#/demo/alpha?scenario=zz')
    expect(api.active.value).toBeNull()
    expect(api.problems.value).toEqual(['scenario'])
    // a scenario id that exists only on another tool
    const other = defineTool({ ...alpha, id: 'other', scenarios: [{ id: 'o1', query: { n: '9' }, action: 'go' }] })
    expect(scenarioById(other, 'o1')).not.toBeNull()
    await setHash('#/demo/alpha?scenario=o1')
    expect(api.active.value).toBeNull()
    expect(api.problems.value).toEqual(['scenario'])
    await setHash('#/demo/alpha?scenario=a2')
    expect(api.problems.value).toEqual([])
    expect(calls).toEqual(['go@scenario=a2'])
  })

  it('ignores a route that names another tool (scenario ownership)', async () => {
    const { api, calls } = await mountView('#/demo/alpha?scenario=a1')
    expect(api.active.value?.id).toBe('a1')
    await setHash('#/demo/beta?scenario=a2')
    expect(api.active.value?.id).toBe('a1') // untouched: the next view adopts that route
    expect(api.problems.value).toEqual([])
    expect(calls).toEqual([])
    expect(beta.scenarios).toEqual([])
  })

  it('reports deviation from the scenario query', async () => {
    const { api, current } = await mountView('#/demo/alpha?n=5&scenario=a1')
    current.value = { n: '5' }
    expect(api.deviated.value).toBe(false)
    current.value = { n: '5', mode: 'b' }
    expect(api.deviated.value).toBe(true)
    api.dismiss()
    expect(api.deviated.value).toBe(false)
  })
})
