import { describe, expect, it } from 'vitest'
import { lookup } from '../src/catalog'
import { defineCourse, defineLab, defineTool } from '../src/define'
import { LabError } from '../src/errors'
import { alpha, beta, demoCourse, demoLab } from './fixtures/demoLab'

function failure(fn: () => unknown): LabError {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(LabError)
    return e as LabError
  }
  throw new Error('did not throw')
}

describe('defineTool', () => {
  it('returns a valid definition unchanged', () => {
    expect(defineTool(alpha)).toBe(alpha)
  })

  it('rejects a scenario query that does not omit defaults', () => {
    expect(() => defineTool({ ...alpha, scenarios: [{ id: 'x', query: { n: '3' } }] })).toThrow(/BAD_DEFINITION/) // default not omitted
    const e = failure(() => defineTool({ ...alpha, scenarios: [{ id: 'x', query: { n: '3' } }] }))
    expect(e.code).toBe('BAD_DEFINITION')
    expect(e.details?.id).toBe('x')
    expect(typeof e.details?.reason).toBe('string')
  })

  it('rejects a scenario query with parse problems or unknown parameters', () => {
    expect(() => defineTool({ ...alpha, scenarios: [{ id: 'x', query: { n: '99' } }] })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, scenarios: [{ id: 'x', query: { mode: 'z' } }] })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, scenarios: [{ id: 'x', query: { n: '5', extra: '1' } }] })).toThrow(/BAD_DEFINITION/)
  })

  it('rejects duplicate scenario ids and bad ids', () => {
    const s = { id: 'a1', query: { n: '5' } }
    expect(() => defineTool({ ...alpha, scenarios: [s, s] })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, id: 'Alpha' })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, id: 'a' })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, id: '1alpha' })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, scenarios: [{ id: 'A 1', query: { n: '5' } }] })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, id: 'x'.repeat(42) })).toThrow(/BAD_DEFINITION/)
    expect(() => defineTool({ ...alpha, id: 'ok-id-2' })).not.toThrow()
  })
})

describe('defineLab / defineCourse', () => {
  it('rejects duplicate tool ids and bad lab ids', () => {
    expect(failure(() => defineLab({ ...demoLab, tools: [alpha, alpha] })).code).toBe('BAD_DEFINITION')
    expect(() => defineLab({ ...demoLab, id: 'Demo' })).toThrow(/BAD_DEFINITION/)
    expect(defineLab(demoLab)).toBe(demoLab)
  })

  it('rejects duplicate lab ids', () => {
    expect(() => defineCourse({ ...demoCourse, labs: [demoLab, demoLab] })).toThrow(/BAD_DEFINITION/)
    expect(() => defineCourse({ ...demoCourse, id: 'x' })).toThrow(/BAD_DEFINITION/)
    expect(defineCourse(demoCourse)).toBe(demoCourse)
  })
})

describe('demo lab fixture', () => {
  it('has every message key of the conventions in DE and EN', () => {
    const keys: string[] = []
    for (const t of demoLab.tools) {
      keys.push(`${t.id}.help.purpose`)
      for (const r of t.help.read) keys.push(`${t.id}.help.read.${r.key}`, r.title)
      for (const c of t.help.controls) {
        keys.push(`${t.id}.help.controls.${c.key}`)
        if (typeof c.label === 'string') keys.push(c.label)
      }
      for (const s of t.scenarios) for (const f of ['title', 'short', 'see', 'watch', 'next']) keys.push(`scenario.${s.id}.${f}`)
    }
    expect(keys.length).toBeGreaterThan(10)
    for (const lang of ['de', 'en'] as const) {
      for (const k of keys) expect(typeof lookup(demoLab.messages[lang], k), `${lang}:${k}`).toBe('string')
    }
    expect(beta.scenarios).toEqual([])
  })
})
