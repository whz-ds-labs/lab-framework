import { describe, expect, it } from 'vitest'
import { catalogKeys, translate } from '@whz-ds-labs/lab-kit'
import { catalogParity } from '@whz-ds-labs/lab-kit/testing'
import { installKitMessages } from '../src/kitMessages'
import de from '../src/messages/de'
import en from '../src/messages/en'

describe('kit messages', () => {
  it('has the same keys and placeholders in de and en', () => {
    expect(catalogParity(de, en)).toEqual([])
  })

  it('covers the namespaces used by the components', () => {
    for (const ns of ['nav', 'lang', 'notice', 'url', 'scenario', 'help', 'ref', 'status', 'home']) {
      expect(Object.keys(de), ns).toContain(ns)
    }
    for (const key of ['nav.home', 'lang.toggle', 'notice.invalidUrl', 'notice.dismiss', 'url.problem', 'status.loading']) {
      expect(catalogKeys(de)).toContain(key)
    }
  })

  it('registers under the kit scope', () => {
    installKitMessages()
    expect(translate('de', 'kit.lang.toggle')).toBe('Sprache wechseln')
    expect(translate('en', 'kit.lang.toggle')).toBe('Switch language')
    expect(translate('en', 'kit.url.problem', { param: 'n' })).toContain('n')
  })

  it('is idempotent', () => {
    installKitMessages()
    installKitMessages()
    expect(translate('de', 'kit.notice.dismiss')).toBe('Hinweis schließen')
  })
})
