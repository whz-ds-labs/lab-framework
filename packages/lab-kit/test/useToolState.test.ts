import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { resetRoute, setHash, settle } from './helpers/browser'
import { useRoute } from '../src/router'
import { toggleLang } from '../src/i18n'
import { useToolState } from '../src/useToolState'
import { alpha, beta, type AlphaState } from './fixtures/demoLab'

let wrapper: VueWrapper | null = null

beforeEach(() => resetRoute())

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

type Api = ReturnType<typeof useToolState<AlphaState>>

async function mountAlpha(hash: string): Promise<{ api: Api; calls: string[] }> {
  await setHash(hash)
  const calls: string[] = []
  let api!: Api
  wrapper = mount(
    defineComponent({
      setup() {
        api = useToolState('demo', alpha, (action) => calls.push(`${action}@${JSON.stringify(api.state.value)}`))
        return () => h('div')
      },
    }),
  )
  await settle()
  return { api, calls }
}

describe('useToolState', () => {
  it('takes the initial state from the route and reports parse problems', async () => {
    const { api } = await mountAlpha('#/demo/alpha?n=99&mode=b')
    expect(api.state.value).toEqual({ n: 10, mode: 'b' })
    expect(api.problems.value).toEqual(['n'])
  })

  it('starts from the defaults when the route is clean', async () => {
    const { api } = await mountAlpha('#/demo/alpha')
    expect(api.state.value).toEqual({ n: 3, mode: 'a' })
    expect(api.problems.value).toEqual([])
  })

  it('setState writes the URL without a hashchange, a later hashchange re-parses', async () => {
    const { api } = await mountAlpha('#/demo/alpha?lang=en')
    const route = useRoute()
    const routeBefore = route.value
    api.setState({ n: 6, mode: 'b' })
    await settle()
    expect(api.state.value).toEqual({ n: 6, mode: 'b' })
    expect(window.location.hash).toBe('#/demo/alpha?n=6&mode=b&lang=en') // lang kept
    expect(route.value).toBe(routeBefore) // no hashchange reached the router
    await setHash('#/demo/alpha?n=2&lang=en')
    expect(api.state.value).toEqual({ n: 2, mode: 'a' })
    expect(route.value).not.toBe(routeBefore)
  })

  it('setState back to the defaults writes the bare tool path', async () => {
    const { api } = await mountAlpha('#/demo/alpha?n=6')
    api.setState({ n: 3, mode: 'a' })
    expect(window.location.hash).toBe('#/demo/alpha')
  })

  it('keeps lang when the language is toggled and the state is written afterwards', async () => {
    const { api } = await mountAlpha('#/demo/alpha?n=6')
    toggleLang()
    const lang = new URLSearchParams(window.location.hash.split('?')[1]).get('lang')
    expect(lang === 'de' || lang === 'en').toBe(true)
    api.setState({ n: 7, mode: 'a' })
    expect(window.location.hash).toBe(`#/demo/alpha?n=7&lang=${lang}`)
    await settle()
    expect(api.state.value.n).toBe(7)
  })

  it('does not re-parse for a route that names another tool or lab', async () => {
    const { api } = await mountAlpha('#/demo/alpha?n=6')
    await setHash(`#/demo/${beta.id}?n=9`)
    expect(api.state.value.n).toBe(6)
    await setHash('#/other/alpha?n=9')
    expect(api.state.value.n).toBe(6)
  })

  it('merges parse problems and scenario problems without duplicates', async () => {
    const { api } = await mountAlpha('#/demo/alpha?n=99&scenario=zz')
    expect(api.problems.value).toEqual(['n', 'scenario'])
    await setHash('#/demo/alpha?scenario=zz&n=x&mode=q')
    expect(api.problems.value).toEqual(['n', 'mode', 'scenario'])
    await setHash('#/demo/alpha?n=5&scenario=a1')
    expect(api.problems.value).toEqual([])
  })

  it('runs the scenario action once, after the state was adopted', async () => {
    const { api, calls } = await mountAlpha('#/demo/alpha?mode=b&scenario=a2')
    expect(api.scenario.active.value?.id).toBe('a2')
    expect(calls).toEqual(['go@{"n":3,"mode":"b"}'])
    // user edits and the URL writes never re-run it
    api.setState({ n: 4, mode: 'b' })
    await settle()
    expect(calls).toHaveLength(1)
    expect(api.scenario.deviated.value).toBe(true)
    // restore re-applies the identical scenario address: state resets, the action runs again, once
    api.scenario.restore()
    await settle()
    expect(api.state.value).toEqual({ n: 3, mode: 'b' })
    expect(calls).toEqual(['go@{"n":3,"mode":"b"}', 'go@{"n":3,"mode":"b"}'])
    expect(api.scenario.deviated.value).toBe(false)
    // dismiss: no action, scenario gone from the address and from later writes
    api.scenario.dismiss()
    api.setState({ n: 5, mode: 'b' })
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?n=5&mode=b')
    expect(calls).toHaveLength(2)
  })

  it('applying a scenario from the state adopts its query', async () => {
    const { api } = await mountAlpha('#/demo/alpha?n=9')
    api.scenario.apply(alpha.scenarios[0]!)
    await settle()
    expect(window.location.hash).toBe('#/demo/alpha?n=5&scenario=a1')
    expect(api.state.value).toEqual({ n: 5, mode: 'a' })
    expect(api.scenario.active.value?.id).toBe('a1')
  })
})
