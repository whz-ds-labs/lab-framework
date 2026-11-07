/** Pure message-catalog helpers (no vue, no DOM): the Node-only `/testing` entry imports this module. */

export type Catalog = { [key: string]: string | Catalog }

/** All leaf keys of a catalog as sorted dotted paths. */
export function catalogKeys(c: Catalog, prefix = ''): string[] {
  const out: string[] = []
  for (const [k, v] of Object.entries(c)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') out.push(path)
    else out.push(...catalogKeys(v, path))
  }
  return out.sort()
}

/** Names of the `{name}` placeholders in a message, in order of appearance (duplicates kept once). */
export function placeholderNames(s: string): string[] {
  const names: string[] = []
  for (const m of s.matchAll(/\{(\w+)\}/g)) {
    if (!names.includes(m[1]!)) names.push(m[1]!)
  }
  return names
}

/** Resolves a dotted key; undefined when missing or when the key points at a sub-catalog. */
export function lookup(c: Catalog, key: string): string | undefined {
  let cur: string | Catalog | undefined = c
  for (const part of key.split('.')) {
    if (cur === undefined || typeof cur !== 'object') return undefined
    cur = Object.prototype.hasOwnProperty.call(cur, part) ? cur[part] : undefined
  }
  return typeof cur === 'string' ? cur : undefined
}
