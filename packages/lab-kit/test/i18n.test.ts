import { beforeEach, describe, expect, it, vi } from 'vitest'
import { catalogKeys, lookup, placeholderNames } from '../src/catalog'
import { localized, registerMessages, setLang, toggleLang, translate, useI18n } from '../src/i18n'

// Language, URL and storage are global; reset them so test order does not matter.
function reset(): void {
  localStorage.clear()
  history.replaceState(null, '', '#/')
  setLang('de')
  localStorage.clear()
}

beforeEach(() => {
  reset()
  registerMessages('demo', {
    de: { a: { b: 'Hallo {name}' }, only: 'nur de' },
    en: { a: { b: 'Hello {name}' } },
  })
})

describe('catalog helpers', () => {
  it('catalogKeys returns sorted dotted keys', () => {
    expect(catalogKeys({ x: { z: '2', y: '1' }, a: 'k' })).toEqual(['a', 'x.y', 'x.z'])
  })
  it('placeholderNames lists names in order, once each', () => {
    expect(placeholderNames('{a} und {b}')).toEqual(['a', 'b'])
    expect(placeholderNames('{a} {a}')).toEqual(['a'])
    expect(placeholderNames('none')).toEqual([])
  })
  it('lookup resolves leaves only', () => {
    expect(lookup({ a: { b: 'x' } }, 'a.b')).toBe('x')
    expect(lookup({ a: { b: 'x' } }, 'a')).toBeUndefined()
    expect(lookup({ a: { b: 'x' } }, 'a.b.c')).toBeUndefined()
    expect(lookup({ a: 'x' }, 'toString')).toBeUndefined()
  })
})

describe('translate', () => {
  it('fills placeholders and keeps unknown ones', () => {
    expect(translate('de', 'demo.a.b', { name: 'X' })).toBe('Hallo X')
    expect(translate('en', 'demo.a.b', { name: 'X' })).toBe('Hello X')
    expect(translate('de', 'demo.a.b', {})).toBe('Hallo {name}')
  })
  it('ignores inherited keys of vars', () => {
    registerMessages('demo', { de: { p: 'x {toString}' }, en: { p: 'x {toString}' } })
    expect(translate('de', 'demo.p', {})).toBe('x {toString}')
  })
  it('returns the key when missing (key, scope or language)', () => {
    expect(translate('en', 'demo.missing')).toBe('demo.missing')
    expect(translate('en', 'demo.only')).toBe('demo.only')
    expect(translate('de', 'nope.a')).toBe('nope.a')
    expect(translate('de', 'plain')).toBe('plain')
  })
  it('replaces a scope when registered again', () => {
    registerMessages('demo', { de: { a: { b: 'Neu' } }, en: { a: { b: 'New' } } })
    expect(translate('de', 'demo.a.b')).toBe('Neu')
  })
})

describe('useI18n', () => {
  it('takes full keys without scope, scope-relative keys with scope', () => {
    expect(useI18n().t('demo.a.b', { name: 'Y' })).toBe('Hallo Y')
    expect(useI18n('demo').t('a.b', { name: 'Y' })).toBe('Hallo Y')
  })
  it('follows the language and localized()', () => {
    const { t, lang } = useI18n()
    expect(lang.value).toBe('de')
    setLang('en')
    expect(t('demo.a.b', { name: 'Y' })).toBe('Hello Y')
    expect(localized({ de: 'd', en: 'e' })).toBe('e')
  })
})

describe('toggleLang / setLang', () => {
  it('writes lang into the hash query via replaceState and persists it', () => {
    let hashchanges = 0
    const onHash = () => hashchanges++
    window.addEventListener('hashchange', onHash)
    history.replaceState(null, '', '#/lab?x=1')
    toggleLang()
    window.removeEventListener('hashchange', onHash)
    expect(location.hash).toContain('lang=en')
    expect(location.hash).toContain('x=1')
    expect(localStorage.getItem('ds-labs-lang')).toBe('en')
    expect(useI18n().lang.value).toBe('en')
    expect(hashchanges).toBe(0)
    toggleLang()
    expect(location.hash).toContain('lang=de')
    expect(localStorage.getItem('ds-labs-lang')).toBe('de')
  })
})

describe('initial language precedence', () => {
  // The language ref is created once per module load: drop it from the shared state and re-import.
  async function freshLang(): Promise<string> {
    const root = (globalThis as unknown as Record<symbol, Record<string, unknown>>)[Symbol.for('whz-ds-labs.lab-kit.state')]
    delete root?.lang
    delete root?.catalogs
    vi.resetModules()
    const mod = await import('../src/i18n')
    return mod.useI18n().lang.value
  }

  it('defaults to de', async () => {
    expect(await freshLang()).toBe('de')
  })
  it('uses localStorage when the URL has no lang', async () => {
    localStorage.setItem('ds-labs-lang', 'en')
    expect(await freshLang()).toBe('en')
  })
  it('prefers the hash query over localStorage and persists it', async () => {
    localStorage.setItem('ds-labs-lang', 'de')
    history.replaceState(null, '', '#/lab?lang=en')
    expect(await freshLang()).toBe('en')
    expect(localStorage.getItem('ds-labs-lang')).toBe('en')
  })
  it('uses the search part when the hash has no lang', async () => {
    history.replaceState(null, '', '/?lang=en#/')
    try {
      expect(await freshLang()).toBe('en')
      expect(localStorage.getItem('ds-labs-lang')).toBe('en')
    } finally {
      history.replaceState(null, '', '/#/')
    }
  })
  it('prefers the hash query over the search part', async () => {
    history.replaceState(null, '', '/?lang=de#/lab?lang=en')
    try {
      expect(await freshLang()).toBe('en')
    } finally {
      history.replaceState(null, '', '/#/')
    }
  })
  it('ignores an unknown lang and falls back to localStorage, then de', async () => {
    history.replaceState(null, '', '#/lab?lang=xx')
    localStorage.setItem('ds-labs-lang', 'en')
    expect(await freshLang()).toBe('en')
    localStorage.clear()
    expect(await freshLang()).toBe('de')
    expect(localStorage.getItem('ds-labs-lang')).toBeNull()
  })
})
