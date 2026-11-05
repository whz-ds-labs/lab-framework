import { describe, expect, it } from 'vitest'
import { defineTool } from '../src/define'
import { isDeviated, normalizeToolQuery, parseScenarioParam, scenarioById, scenarioHref } from '../src/scenarios'
import { alpha, beta } from './fixtures/demoLab'

const a1 = alpha.scenarios[0]!
const a2 = alpha.scenarios[1]!

describe('scenario helpers', () => {
  it('finds scenarios by id per tool', () => {
    expect(scenarioById(alpha, 'a2')).toBe(a2)
    expect(scenarioById(alpha, 'nope')).toBeNull()
    expect(scenarioById(beta, 'a1')).toBeNull() // ownership: a scenario of another tool is unknown
    expect(a1.action).toBeUndefined()
    expect(a2.action).toBe('go')
  })

  it('stores normalized queries that parse without problems', () => {
    for (const s of alpha.scenarios) {
      expect(alpha.parse(s.query).problems, s.id).toEqual([])
      expect(normalizeToolQuery(alpha, s.query), s.id).toEqual(s.query)
    }
  })

  it('parses the scenario parameter', () => {
    expect(parseScenarioParam(alpha, { scenario: 'a2' })).toEqual({ scenario: a2, problems: [] })
    expect(parseScenarioParam(alpha, {})).toEqual({ scenario: null, problems: [] })
    expect(parseScenarioParam(alpha, { scenario: 'xyz' })).toEqual({ scenario: null, problems: ['scenario'] })
    // scenario of another tool
    expect(parseScenarioParam(beta, { scenario: 'a2' })).toEqual({ scenario: null, problems: ['scenario'] })
    const other = defineTool({ ...alpha, id: 'other', scenarios: [{ id: 'o1', query: { n: '9' } }] })
    expect(parseScenarioParam(alpha, { scenario: 'o1' })).toEqual({ scenario: null, problems: ['scenario'] })
    expect(parseScenarioParam(other, { scenario: 'o1' }).problems).toEqual([])
  })

  it('normalizes: defaults omitted, unknown parameters dropped', () => {
    expect(normalizeToolQuery(alpha, { n: '3', mode: 'a', scenario: 'a1', lang: 'en' })).toEqual({})
    expect(normalizeToolQuery(alpha, { mode: 'b', n: '5.0' })).toEqual({ n: '5', mode: 'b' })
  })

  it('detects deviation independent of defaults and order', () => {
    expect(isDeviated(alpha, a1, { n: '5' })).toBe(false)
    expect(isDeviated(alpha, a1, { n: '5', mode: 'a' })).toBe(false)
    expect(isDeviated(alpha, a1, { n: '5', mode: 'b' })).toBe(true)
    expect(isDeviated(alpha, a1, { n: '5', scenario: 'a1', lang: 'en' })).toBe(false)
    expect(isDeviated(alpha, a1, {})).toBe(true)
    expect(isDeviated(alpha, a1, { n: '5.0' })).toBe(false)
    expect(isDeviated(alpha, a1, { n: '6' })).toBe(true)
    const both = { id: 'b1', query: { n: '5', mode: 'b' } }
    expect(isDeviated(alpha, both, { mode: 'b', n: '5' })).toBe(false)
  })

  it('builds scenario links', () => {
    expect(scenarioHref('demo', alpha, a1)).toBe('#/demo/alpha?n=5&scenario=a1')
    expect(scenarioHref('demo', alpha, a1, 'en')).toBe('#/demo/alpha?n=5&scenario=a1&lang=en')
    expect(scenarioHref('demo', alpha, a2)).toBe('#/demo/alpha?mode=b&scenario=a2')
  })
})
