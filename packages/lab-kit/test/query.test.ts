import { describe, expect, it } from 'vitest'
import { formatNumber, parseBool, parseEnum, parseNumber, type Query } from '../src/query'

describe('query parsers', () => {
  it('parseEnum returns the default silently when the parameter is absent', () => {
    const problems: string[] = []
    expect(parseEnum({}, 'criterion', ['gini', 'entropy'] as const, 'gini', problems)).toBe('gini')
    expect(problems).toEqual([])
  })

  it('parseEnum accepts allowed values and reports unknown ones by parameter name', () => {
    const problems: string[] = []
    expect(parseEnum({ criterion: 'entropy' }, 'criterion', ['gini', 'entropy'] as const, 'gini', problems)).toBe(
      'entropy',
    )
    expect(problems).toEqual([])
    expect(parseEnum({ criterion: 'x' }, 'criterion', ['gini', 'entropy'] as const, 'gini', problems)).toBe('gini')
    expect(problems).toEqual(['criterion'])
  })

  it('parseNumber clamps and rounds, adding exactly one problem per correction', () => {
    const range = { min: 1, max: 10, integer: true }
    const problems: string[] = []
    expect(parseNumber({ n: '5' }, 'n', range, 3, problems)).toBe(5)
    expect(problems).toEqual([])
    expect(parseNumber({ n: '99' }, 'n', range, 3, problems)).toBe(10)
    expect(parseNumber({ n: '0' }, 'n', range, 3, problems)).toBe(1)
    expect(parseNumber({ n: '2.6' }, 'n', range, 3, problems)).toBe(3)
    expect(problems).toEqual(['n', 'n', 'n'])
  })

  it('parseNumber accepts plain decimals and treats everything else as unreadable', () => {
    const range = { min: 0, max: 1 }
    const problems: string[] = []
    expect(parseNumber({ x: '0.05' }, 'x', range, 0.3, problems)).toBe(0.05)
    expect(problems).toEqual([])
    for (const bad of ['', 'NaN', '1e3', 'Infinity', 'abc']) {
      expect(parseNumber({ x: bad }, 'x', range, 0.3, problems)).toBe(0.3)
    }
    expect(problems).toEqual(['x', 'x', 'x', 'x', 'x'])
  })

  it('parseBool reads 0/1 and reports anything else', () => {
    const problems: string[] = []
    expect(parseBool({}, 'b', true, problems)).toBe(true)
    expect(parseBool({ b: '0' }, 'b', true, problems)).toBe(false)
    expect(parseBool({ b: '1' }, 'b', false, problems)).toBe(true)
    expect(problems).toEqual([])
    expect(parseBool({ b: 'yes' }, 'b', true, problems)).toBe(true)
    expect(problems).toEqual(['b'])
  })

  it('ignores unknown parameters and inherited property names', () => {
    const q: Query = { lang: 'en', foo: 'bar' }
    const problems: string[] = []
    expect(parseNumber(q, 'toString', { min: 0, max: 1 }, 0.5, problems)).toBe(0.5)
    expect(problems).toEqual([])
  })

  it('formatNumber prints plain decimals without exponent', () => {
    expect(formatNumber(0.5)).toBe('0.5')
    expect(formatNumber(200)).toBe('200')
    expect(formatNumber(1e-7)).toBe('0.0000001')
    expect(formatNumber(1.5e-10)).toBe('0.00000000015')
    expect(parseNumber({ x: formatNumber(1e-7) }, 'x', { min: 0, max: 1 }, 0.5, [])).toBe(1e-7)
  })
})
