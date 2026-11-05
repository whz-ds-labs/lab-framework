import { beforeEach, describe, expect, it } from 'vitest'
import { watch } from 'vue'
import { resetRoute, setHash } from './helpers/browser'
import { buildHash, parseHash, refreshRoute, resolveRoute, sameHash, useRoute } from '../src/router'
import { sharedState } from '../src/state'
import { demoCourse as course, demoLab } from './fixtures/demoLab'

beforeEach(() => resetRoute())

describe('parseHash', () => {
  it('splits segments and params, trimming slashes', () => {
    const p = parseHash('#/demo/alpha?n=5&lang=en')
    expect(p.segments).toEqual(['demo', 'alpha'])
    expect(Object.fromEntries(p.params)).toEqual({ n: '5', lang: 'en' })
    expect(parseHash('').segments).toEqual([])
    expect(parseHash('#/').segments).toEqual([])
    expect(parseHash('#demo/alpha/').segments).toEqual(['demo', 'alpha'])
    expect(parseHash('#/?lang=en').segments).toEqual([])
    expect(parseHash('#/?lang=en').params.get('lang')).toBe('en')
  })
})

describe('resolveRoute', () => {
  it('resolves course, lab and tool', () => {
    expect(resolveRoute(course, parseHash('#/'))).toEqual({ route: { kind: 'course' }, unknownRoute: false })
    const lab = resolveRoute(course, parseHash('#/demo'))
    expect(lab.route).toEqual({ kind: 'lab', lab: demoLab })
    expect(lab.unknownRoute).toBe(false)
    const tool = resolveRoute(course, parseHash('#/demo/alpha?n=5'))
    expect(tool.route.kind).toBe('tool')
    if (tool.route.kind === 'tool') expect(tool.route.tool.id).toBe('alpha')
    expect(tool.unknownRoute).toBe(false)
  })

  it('falls back and flags unknown routes', () => {
    expect(resolveRoute(course, parseHash('#/demo/nope')).route.kind).toBe('lab')
    expect(resolveRoute(course, parseHash('#/demo/nope')).unknownRoute).toBe(true)
    expect(resolveRoute(course, parseHash('#/nope')).route.kind).toBe('course')
    expect(resolveRoute(course, parseHash('#/nope')).unknownRoute).toBe(true)
    expect(resolveRoute(course, parseHash('#/nope/alpha')).unknownRoute).toBe(true)
    const deep = resolveRoute(course, parseHash('#/demo/alpha/extra'))
    expect(deep.route.kind).toBe('course')
    expect(deep.unknownRoute).toBe(true)
  })
})

describe('buildHash', () => {
  it('builds course, lab and tool addresses', () => {
    expect(buildHash({})).toBe('#/')
    expect(buildHash({ lab: 'demo' })).toBe('#/demo')
    expect(buildHash({ lab: 'demo', tool: 'alpha' })).toBe('#/demo/alpha')
    expect(buildHash({ lab: 'demo', tool: 'alpha' }, { n: '5' })).toBe('#/demo/alpha?n=5')
    expect(buildHash({ lab: 'demo', tool: 'alpha' }, {})).toBe('#/demo/alpha')
    expect(buildHash({}, { lang: 'en' })).toBe('#/?lang=en')
  })
})

describe('sameHash', () => {
  it('ignores parameter order and a missing slash', () => {
    expect(sameHash('#/demo/alpha?a=1&b=2', '#/demo/alpha?b=2&a=1')).toBe(true)
    expect(sameHash('#/demo/alpha?a=1', '#demo/alpha?a=1')).toBe(true)
  })

  it('distinguishes routes and values', () => {
    expect(sameHash('#/demo/alpha?a=1', '#/demo/beta?a=1')).toBe(false)
    expect(sameHash('#/demo/alpha?a=1', '#/demo?a=1')).toBe(false)
    expect(sameHash('#/demo/alpha?a=1', '#/demo/alpha?a=2')).toBe(false)
    expect(sameHash('#/demo/alpha?a=1', '#/demo/alpha?a=1&b=2')).toBe(false)
  })
})

describe('useRoute / refreshRoute', () => {
  it('follows hashchange', async () => {
    const route = useRoute()
    await setHash('#/demo/alpha?n=5')
    expect(route.value.segments).toEqual(['demo', 'alpha'])
    expect(route.value.params.get('n')).toBe('5')
  })

  it('keeps the route ref in the shared state, one ref for every call', () => {
    expect(useRoute()).toBe(useRoute())
    const shared = sharedState('router', () => null as unknown as { current: unknown })
    expect(shared.current).toBe(useRoute())
  })

  it('installs the hashchange listener only once', async () => {
    const route = useRoute()
    refreshRoute()
    refreshRoute()
    let writes = 0
    const stop = watch(() => route.value, () => writes++, { flush: 'sync' })
    await setHash('#/demo/beta')
    stop()
    // one assignment per listener; a duplicated listener would assign twice
    expect(writes).toBe(1)
  })

  it('creates a new route object for an unchanged address, so watchers fire', async () => {
    await setHash('#/demo/alpha?n=5')
    const route = useRoute()
    const before = route.value
    refreshRoute()
    expect(route.value).not.toBe(before)
    expect(route.value.segments).toEqual(before.segments)
    expect(Object.fromEntries(route.value.params)).toEqual({ n: '5' })
  })
})
