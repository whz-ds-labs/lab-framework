import { beforeEach, describe, expect, it } from 'vitest'
import './helpers/browser'
import { defineTool } from '../src/define'
import { removeScenarioParam, writeToolQuery } from '../src/url'
import { alpha, beta } from './fixtures/demoLab'

function setLive(hash: string): void {
  history.replaceState(null, '', hash)
}

beforeEach(() => setLive('#/'))

describe('writeToolQuery', () => {
  it('writes the query and keeps lang and a scenario of the same tool', () => {
    setLive('#/demo/alpha?n=5&lang=en&scenario=a1')
    writeToolQuery('demo', alpha, { mode: 'b' })
    expect(window.location.hash).toBe('#/demo/alpha?mode=b&lang=en&scenario=a1')
  })

  it('drops a scenario of another tool', () => {
    const other = defineTool({ ...alpha, id: 'other', scenarios: [{ id: 'o1', query: { n: '9' } }] })
    setLive('#/demo/alpha?n=5&scenario=o1')
    writeToolQuery('demo', alpha, { n: '5' })
    expect(window.location.hash).toBe('#/demo/alpha?n=5')
    setLive('#/demo/beta?scenario=a1')
    writeToolQuery('demo', beta, {})
    expect(window.location.hash).toBe('#/demo/beta')
    setLive('#/demo/other?scenario=o1')
    writeToolQuery('demo', other, {})
    expect(window.location.hash).toBe('#/demo/other?scenario=o1')
  })

  it('drops an unknown scenario', () => {
    setLive('#/demo/alpha?scenario=zz&lang=de')
    writeToolQuery('demo', alpha, {})
    expect(window.location.hash).toBe('#/demo/alpha?lang=de')
  })

  it('writes the bare tool path for an empty query', () => {
    setLive('#/demo/alpha?n=5')
    writeToolQuery('demo', alpha, {})
    expect(window.location.hash).toBe('#/demo/alpha')
  })

  it('uses replaceState: no history entry', () => {
    const before = history.length
    writeToolQuery('demo', alpha, { n: '7' })
    expect(history.length).toBe(before)
  })
})

describe('removeScenarioParam', () => {
  it('removes only scenario', () => {
    setLive('#/demo/alpha?n=5&scenario=a1&lang=en')
    removeScenarioParam()
    expect(window.location.hash).toBe('#/demo/alpha?n=5&lang=en')
  })

  it('leaves an address without scenario as it is', () => {
    setLive('#/demo/alpha?n=5')
    removeScenarioParam()
    expect(window.location.hash).toBe('#/demo/alpha?n=5')
  })

  it('drops the question mark when scenario was the only parameter', () => {
    setLive('#/demo/alpha?scenario=a1')
    removeScenarioParam()
    expect(window.location.hash).toBe('#/demo/alpha')
  })
})
