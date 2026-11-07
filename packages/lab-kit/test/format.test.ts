import { describe, expect, it } from 'vitest'
import { fmt, fmtValue } from '../src/format'

describe('fmt', () => {
  it('uses a fixed number of decimals with the language-specific separator', () => {
    expect(fmt('de', 0.9234)).toBe('0,923')
    expect(fmt('en', 0.9234)).toBe('0.923')
    expect(fmt('en', 1, 2)).toBe('1.00')
  })
})

describe('fmtValue', () => {
  it('prints as many decimals as needed (max 6)', () => {
    expect(fmtValue('en', 2.5)).toBe('2.5')
    expect(fmtValue('de', 2.5)).toBe('2,5')
    expect(fmtValue('en', 3)).toBe('3')
    expect(fmtValue('en', 0.12345678)).toBe('0.123457')
  })
})
