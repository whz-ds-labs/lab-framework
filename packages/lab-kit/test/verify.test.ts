import { describe, expect, it } from 'vitest'
import { verifyAttrs } from '../src/verify'

describe('verifyAttrs', () => {
  it('sets unit, state and count', () => {
    expect(verifyAttrs('x', 'ready', { count: 3 })).toEqual({
      'data-verify-unit': 'x',
      'data-verify-state': 'ready',
      'data-verify-count': '3',
    })
  })

  it('sets data-verify-error only in the error state', () => {
    expect(verifyAttrs('x', 'error', { error: 'CSV_PARSE' })['data-verify-error']).toBe('CSV_PARSE')
    expect(verifyAttrs('x', 'error')['data-verify-error']).toBe('unknown')
    expect(verifyAttrs('x', 'ready', { error: 'ignored' })).not.toHaveProperty('data-verify-error')
  })

  it('omits the count when absent and keeps a zero count', () => {
    expect(verifyAttrs('x', 'loading')).toEqual({ 'data-verify-unit': 'x', 'data-verify-state': 'loading' })
    expect(verifyAttrs('x', 'empty', { count: 0 })['data-verify-count']).toBe('0')
  })
})
