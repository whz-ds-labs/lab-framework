/**
 * Module-level state of lab-kit (language ref, route ref, notices, message catalogs) lives in one object on
 * `globalThis[Symbol.for('whz-ds-labs.lab-kit.state')]`, so a duplicated copy of the package still shares one state.
 */
const STATE_KEY = Symbol.for('whz-ds-labs.lab-kit.state')

type StateRoot = Record<string, unknown>

/** Returns the entry `key` of the shared state object, creating it with `init` on first access. */
export function sharedState<T>(key: string, init: () => T): T {
  const g = globalThis as unknown as Record<symbol, StateRoot | undefined>
  const root = (g[STATE_KEY] ??= {})
  if (!Object.prototype.hasOwnProperty.call(root, key)) root[key] = init()
  return root[key] as T
}
