import { ref, type Ref } from 'vue'
import { lookup, type Catalog } from './catalog'
import { sharedState } from './state'

export type Lang = 'de' | 'en'
export type Localized = Record<Lang, string>

const STORAGE_KEY = 'ds-labs-lang'

function isLang(x: unknown): x is Lang {
  return x === 'de' || x === 'en'
}

function store(l: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, l)
  } catch {
    /* localStorage unavailable */
  }
}

/** ?lang= from the hash query or the search part, or null. */
function langFromUrl(): Lang | null {
  try {
    if (typeof window === 'undefined') return null
    const hashQuery = window.location.hash.split('?')[1] ?? ''
    const fromHash = new URLSearchParams(hashQuery).get('lang')
    if (isLang(fromHash)) return fromHash
    const fromSearch = new URLSearchParams(window.location.search).get('lang')
    if (isLang(fromSearch)) return fromSearch
  } catch {
    /* location unavailable */
  }
  return null
}

/** Language from ?lang= (hash query or search; persisted, so it sticks), then localStorage, then 'de'. */
function initialLang(): Lang {
  const fromUrl = langFromUrl()
  if (fromUrl) {
    store(fromUrl)
    return fromUrl
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    /* localStorage unavailable */
  }
  return 'de'
}

// Language ref and catalogs live in the shared state, so a duplicated lab-kit copy still shares them.
const lang: Ref<Lang> = sharedState('lang', () => ref<Lang>(initialLang()) as Ref<Lang>)
const catalogs = sharedState('catalogs', () => ({}) as Record<string, Record<Lang, Catalog>>)

/** Registers the catalogs of a scope (`kit`, a lab id); registering the same scope again replaces it (HMR-safe). */
export function registerMessages(scope: string, cats: Record<Lang, Catalog>): void {
  catalogs[scope] = cats
}

export function setLang(next: Lang): void {
  lang.value = next
  store(next)
}

/**
 * Switches DE ↔ EN and writes `lang` into the query of the live hash (replaceState: no hashchange, no history
 * entry), so a copied link opens in the same language. The router state is not touched; views that rewrite the
 * hash read the live location and keep the parameter.
 */
export function toggleLang(): void {
  const next: Lang = lang.value === 'de' ? 'en' : 'de'
  setLang(next)
  try {
    if (typeof window === 'undefined') return
    const body = window.location.hash.replace(/^#/, '')
    const q = body.indexOf('?')
    const path = (q >= 0 ? body.slice(0, q) : body) || '/'
    const params = new URLSearchParams(q >= 0 ? body.slice(q + 1) : '')
    params.set('lang', next)
    history.replaceState(history.state, '', `#${path}?${params.toString()}`)
  } catch {
    /* history unavailable: the language still switches */
  }
}

/** Translates a full dotted key (incl. scope); a missing key returns the key itself. `{name}` placeholders are filled from `vars`. */
export function translate(l: Lang, key: string, vars?: Record<string, string | number>): string {
  const dot = key.indexOf('.')
  const cat = dot > 0 ? catalogs[key.slice(0, dot)]?.[l] : undefined
  const raw = (cat ? lookup(cat, key.slice(dot + 1)) : undefined) ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m)
}

/** `t` without scope takes full keys; with `scope`, `t('a.b')` reads `<scope>.a.b` (lab code only). */
export function useI18n(scope?: string): {
  lang: Ref<Lang>
  t: (key: string, vars?: Record<string, string | number>) => string
} {
  // t reads lang.value, so templates calling it re-render on language change.
  const t = (key: string, vars?: Record<string, string | number>) =>
    translate(lang.value, scope ? `${scope}.${key}` : key, vars)
  return { lang, t }
}

/** Picks the text for the current language (reactive when called in a template or computed). */
export function localized(l: Localized): string {
  return l[lang.value]
}
