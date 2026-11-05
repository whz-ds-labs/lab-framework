import { describe, expect, it } from 'vitest'
import { LabError } from '../src/errors'

describe('LabError', () => {
  it('carries code, details and a default message equal to the code', () => {
    const e = new LabError('CSV_PARSE', { line: 3 })
    expect(e).toBeInstanceOf(Error)
    expect(e.name).toBe('LabError')
    expect(e.code).toBe('CSV_PARSE')
    expect(e.details).toEqual({ line: 3 })
    expect(e.message).toBe('CSV_PARSE')
  })

  it('accepts a custom message and a narrower code type', () => {
    const e = new LabError<'A' | 'B'>('A', undefined, 'boom')
    expect(e.message).toBe('boom')
    expect(e.details).toBeUndefined()
  })
})
