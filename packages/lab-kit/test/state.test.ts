import { describe, expect, it } from 'vitest'
import { sharedState } from '../src/state'

describe('sharedState', () => {
  it('creates an entry once and returns the same object afterwards', () => {
    let calls = 0
    const a = sharedState('test.once', () => {
      calls++
      return { n: 1 }
    })
    const b = sharedState('test.once', () => {
      calls++
      return { n: 2 }
    })
    expect(a).toBe(b)
    expect(a.n).toBe(1)
    expect(calls).toBe(1)
  })

  it('stores entries on globalThis under Symbol.for("whz-ds-labs.lab-kit.state")', () => {
    const entry = sharedState('test.global', () => ({ v: 42 }))
    const root = (globalThis as unknown as Record<symbol, Record<string, unknown>>)[
      Symbol.for('whz-ds-labs.lab-kit.state')
    ]
    expect(root?.['test.global']).toBe(entry)
  })
})
