import { beforeEach, describe, expect, it } from 'vitest'
import { dismissNotice, notify, useNotices } from '../src/notify'

describe('notices', () => {
  beforeEach(() => {
    for (const n of [...useNotices().value]) dismissNotice(n.id)
  })

  it('adds a notice with its full key and vars', () => {
    notify('kit.csv.parseError', { row: 3 })
    expect(useNotices().value).toMatchObject([{ key: 'kit.csv.parseError', vars: { row: 3 } }])
  })

  it('does not add the same key twice', () => {
    notify('kit.a')
    notify('kit.a')
    notify('kit.b')
    expect(useNotices().value.map((n) => n.key)).toEqual(['kit.a', 'kit.b'])
  })

  it('dismisses by id and assigns unique ids', () => {
    notify('kit.a')
    notify('kit.b')
    const [a, b] = useNotices().value
    expect(a.id).not.toBe(b.id)
    dismissNotice(a.id)
    expect(useNotices().value.map((n) => n.key)).toEqual(['kit.b'])
  })

  it('keeps the list in shared state (same ref on every call)', () => {
    expect(useNotices()).toBe(useNotices())
  })
})
