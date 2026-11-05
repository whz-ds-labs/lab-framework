import { describe, expect, it } from 'vitest'
import { countCopies } from '../scripts/link-local.mjs'

describe('countCopies', () => {
  const names = ['vue', '@whz-ds-labs/lab-kit']
  it('counts distinct installed paths and ignores duplicates in the listing', () => {
    const out = [
      'C:\\c',
      'C:\\c\\node_modules\\vue',
      'C:\\c\\node_modules\\vue',
      'C:\\c\\node_modules\\@whz-ds-labs\\lab-kit',
      'C:\\c\\node_modules\\@whz-ds-labs\\ui',
    ].join('\r\n')
    expect(countCopies(out, names)).toEqual({ vue: 1, '@whz-ds-labs/lab-kit': 1 })
  })
  it('reports a second nested copy', () => {
    const out = '/c/node_modules/vue\n/c/node_modules/@whz-ds-labs/ui/node_modules/vue\n'
    expect(countCopies(out, names)).toEqual({ vue: 2, '@whz-ds-labs/lab-kit': 0 })
  })
})
