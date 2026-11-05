import { catalogParity, missingLabMessages } from '@whz-ds-labs/lab-kit/testing'
import { describe, expect, it } from 'vitest'
import { lab } from '../../lab'

describe('messages', () => {
  it('has every key the definitions require, in DE and EN', () => {
    expect(missingLabMessages(lab)).toEqual([])
  })
  it('has identical DE and EN catalogs', () => {
    expect(catalogParity(lab.messages.de, lab.messages.en)).toEqual([])
  })
})
