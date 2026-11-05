import { settle } from './helpers/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, type PropType } from 'vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import {
  defineCourse,
  defineLab,
  defineTool,
  dismissNotice,
  refreshRoute,
  setLang,
  useNotices,
} from '@whz-ds-labs/lab-kit'
import { installKitMessages } from '../src/kitMessages'
import { useNarrowViewport } from '../src/viewport'
import LabShell from '../src/shell/LabShell.vue'
import { createCourseApp } from '../src/shell/createCourseApp'
import { alpha, beta, demoLab, type AlphaState } from './fixtures/demoLab'

const runAction = vi.fn<(name: string) => void>()

/** Tiny tool view: renders state.n, emits an update on click, exposes runAction as a spy. */
const AlphaView = defineComponent({
  props: { state: { type: Object as PropType<AlphaState>, required: true }, labId: { type: String, required: true } },
  emits: ['update:state'],
  setup(props, { emit, expose }) {
    expose({ runAction })
    return () =>
      h('section', { 'data-verify-unit': 'alpha-view', 'data-lab': props.labId }, [
        h('span', { class: 'n' }, String(props.state.n)),
        h('button', { class: 'bump', onClick: () => emit('update:state', { ...props.state, n: 7 }) }, 'bump'),
      ])
  },
})

const lab = defineLab({
  ...demoLab,
  title: { de: 'Demo-Labor', en: 'Demo lab' },
  tools: [
    defineTool({ ...alpha, title: { de: 'Alfa', en: 'Alpha' }, component: AlphaView }),
    defineTool({ ...beta, title: { de: 'Beta DE', en: 'Beta EN' } }),
  ],
})
const course = defineCourse({
  id: 'demo-course',
  title: { de: 'Demo-Kurs', en: 'Demo course' },
  lead: { de: 'Ein Kurs zum Testen.', en: 'A course for testing.' },
  labs: [lab],
  roadmap: [{ title: { de: 'Später', en: 'Later' }, note: { de: 'Folgt.', en: 'Follows.' } }],
})

let mounted: VueWrapper | null = null

async function open(hash: string): Promise<VueWrapper> {
  window.location.hash = hash
  // happy-dom dispatches hashchange asynchronously; let it settle so it cannot hit the mounted shell.
  await settle()
  refreshRoute()
  const w = mount(LabShell, { props: { course }, attachTo: document.body })
  mounted = w
  await flushPromises()
  return w
}

beforeEach(() => {
  createCourseApp(course) // registers kit and lab messages
  installKitMessages()
  setLang('de')
  runAction.mockClear()
  for (const n of [...useNotices().value]) dismissNotice(n.id)
  useNarrowViewport().value = false
})

afterEach(() => {
  mounted?.unmount()
  mounted = null
  window.location.hash = ''
  refreshRoute()
  document.body.style.overflow = ''
})

describe('LabShell', () => {
  it('lists the lab, lead and roadmap on the course home', async () => {
    const w = await open('')
    const root = w.get('[data-verify-unit="lab-shell"]')
    expect(root.attributes('data-verify-state')).toBe('ready')
    expect(root.attributes('data-verify-route')).toBe('')
    expect(w.text()).toContain('Demo-Kurs')
    expect(w.text()).toContain('Ein Kurs zum Testen.')
    const tile = w.get('[data-lab-tile="demo"]')
    expect(tile.text()).toContain('Demo-Labor')
    expect(tile.text()).toContain('Ein Labor zum Testen')
    expect(tile.get('a').attributes('href')).toBe('#/demo')
    const roadmap = w.get('[data-verify-unit="roadmap"]')
    expect(roadmap.attributes('data-verify-count')).toBe('1')
    expect(roadmap.text()).toContain('Später')
    expect(w.find('[data-action="help"]').exists()).toBe(false)
  })

  it('shows tool tiles, badge and scenario links on the lab home', async () => {
    const w = await open('#/demo')
    expect(w.get('[data-verify-unit="lab-shell"]').attributes('data-verify-route')).toBe('demo')
    const a = w.get('[data-tool-tile="alpha"]')
    expect(a.get('a').attributes('href')).toBe('#/demo/alpha')
    expect(a.find('.ref-badge').exists()).toBe(true)
    expect(w.get('[data-tool-tile="beta"]').find('.ref-badge').exists()).toBe(false)
    const link = a.get('[data-scenario-link="a2"]')
    expect(link.attributes('href')).toBe('#/demo/alpha?mode=b&scenario=a2')
    expect(link.text()).toBe('Modus b')
    expect(w.findAll('nav a.ds-pill')).toHaveLength(2)
  })

  it('renders the tool with the state of the address and marks the active pill', async () => {
    const w = await open('#/demo/alpha?n=5')
    expect(w.get('[data-verify-unit="lab-shell"]').attributes('data-verify-route')).toBe('demo/alpha')
    expect(w.get('.n').text()).toBe('5')
    expect(w.get('[data-lab="demo"]').exists()).toBe(true)
    const current = w.findAll('nav a[aria-current="page"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toBe('Alfa')
    expect(w.find('[data-action="help"]').exists()).toBe(true)
  })

  it('writes tool updates to the address without firing hashchange', async () => {
    const w = await open('#/demo/alpha?n=5')
    const spy = vi.fn()
    window.addEventListener('hashchange', spy)
    await w.get('.bump').trigger('click')
    await flushPromises()
    window.removeEventListener('hashchange', spy)
    expect(window.location.hash).toContain('n=7')
    expect(spy).not.toHaveBeenCalled()
    expect(w.get('.n').text()).toBe('7')
  })

  it('runs the scenario action exactly once', async () => {
    await open('#/demo/alpha?scenario=a2&mode=b')
    await nextTick()
    await flushPromises()
    expect(runAction).toHaveBeenCalledTimes(1)
    expect(runAction).toHaveBeenCalledWith('go')
  })

  it('shows the invalid-URL notice for an unknown route', async () => {
    const w = await open('#/nope')
    const notice = w.get('[data-verify-unit="url-notice"]')
    expect(notice.attributes('data-verify-state')).toBe('ready')
    expect(notice.text()).toContain('ungültige Angaben')
    expect(w.get('[data-verify-unit="lab-shell"]').attributes('data-verify-route')).toBe('')
  })

  it('switches the tool pill labels with the language button', async () => {
    const w = await open('#/demo/alpha')
    expect(w.findAll('nav a.ds-pill').map((a) => a.text())).toEqual(['Alfa', 'Beta DE'])
    await w.get('[data-verify-unit="lang-toggle"]').trigger('click')
    expect(w.findAll('nav a.ds-pill').map((a) => a.text())).toEqual(['Alpha', 'Beta EN'])
    expect(document.documentElement.lang).toBe('en')
  })

  it('opens the help drawer pushed on wide screens and closes it with the focus back on the button', async () => {
    const w = await open('#/demo/alpha')
    const btn = w.get('[data-action="help"]')
    await btn.trigger('click')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(w.get('[data-verify-unit="help"]').attributes('data-verify-state')).toBe('ready')
    expect(w.get('main').classes()).toContain('help-pushed')
    expect(w.get('main').attributes('inert')).toBeUndefined()
    await w.get('[data-action="help-close"]').trigger('click')
    await flushPromises()
    expect(w.get('[data-verify-unit="help"]').attributes('data-verify-state')).toBe('empty')
    expect(document.activeElement).toBe(btn.element)
  })

  it('makes the page inert and locks scrolling while the drawer is modal on narrow screens', async () => {
    useNarrowViewport().value = true
    const w = await open('#/demo/alpha')
    await w.get('[data-action="help"]').trigger('click')
    expect(w.get('main').attributes('inert')).toBeDefined()
    expect(w.get('header').attributes('inert')).toBeDefined()
    expect(document.body.style.overflow).toBe('hidden')
    await w.get('[data-action="help-close"]').trigger('click')
    await flushPromises()
    expect(w.get('main').attributes('inert')).toBeUndefined()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes the help when leaving the tool route', async () => {
    const w = await open('#/demo/alpha')
    await w.get('[data-action="help"]').trigger('click')
    window.location.hash = '#/demo'
    await settle()
    expect(w.find('[data-action="help"]').exists()).toBe(false)
    expect(w.get('[data-verify-unit="help"]').attributes('data-verify-state')).toBe('empty')
  })
})

describe('createCourseApp', () => {
  it('registers lab messages and returns an app that mounts the shell', async () => {
    window.location.hash = '#/demo'
    await settle()
    refreshRoute()
    const el = document.createElement('div')
    document.body.appendChild(el)
    const app = createCourseApp(course)
    app.mount(el)
    await flushPromises()
    expect(el.querySelector('[data-verify-unit="lab-shell"]')).not.toBeNull()
    expect(el.textContent).toContain('Modus b')
    app.unmount()
    el.remove()
  })
})
