import { describe, expect, it } from 'vitest'
import { parseLineQuery, toLineQuery } from '../../tools/state'

describe('line state', () => {
  it('gives defaults and an empty query', () => {
    const r = parseLineQuery({})
    expect(r.problems).toEqual([])
    expect(r.state).toEqual({ n: 20, noise: 1, seed: 1, pts: [] })
    expect(toLineQuery(r.state)).toEqual({})
  })

  it('round-trips and normalizes', () => {
    const r = parseLineQuery({ n: '30', noise: '2.5', seed: '7', pts: '1.234:2.5,10:-5' })
    expect(r.problems).toEqual([])
    expect(r.state.pts).toEqual([{ x: 1.23, y: 2.5 }, { x: 10, y: -5 }])
    const q = toLineQuery(r.state)
    expect(q).toEqual({ n: '30', noise: '2.5', seed: '7', pts: '1.23:2.5,10:-5' })
    expect(toLineQuery(parseLineQuery(q).state)).toEqual(q)
  })

  it('omits defaults', () => {
    expect(toLineQuery({ n: 20, noise: 1, seed: 5, pts: [] })).toEqual({ seed: '5' })
  })

  it('clamps numbers and reports them', () => {
    const r = parseLineQuery({ n: '500', noise: 'x', seed: '1.4' })
    expect(r.state).toMatchObject({ n: 200, noise: 1, seed: 1 })
    expect([...r.problems].sort()).toEqual(['n', 'noise', 'seed'])
  })

  it.each(['1:2,x', '11:0', '5:16', '5:-5.1', '1:2:3', '', '1:2,'])('drops invalid pts %j', (pts) => {
    const r = parseLineQuery({ pts })
    expect(r.state.pts).toEqual([])
    expect(r.problems).toEqual(['pts'])
  })

  it('accepts 30 points and rejects 31', () => {
    const make = (k: number) => Array.from({ length: k }, (_, i) => `${(i % 10) + 0.5}:${i % 10}`).join(',')
    const ok = parseLineQuery({ pts: make(30) })
    expect(ok.problems).toEqual([])
    expect(ok.state.pts).toHaveLength(30)
    const bad = parseLineQuery({ pts: make(31) })
    expect(bad.problems).toEqual(['pts'])
    expect(bad.state.pts).toEqual([])
  })
})
