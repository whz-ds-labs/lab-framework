import { nextTick } from 'vue'
import { refreshRoute } from '../../src/router'

/*
 * Browsers never fire `hashchange` for history.replaceState; happy-dom does (asynchronously). Importing this module
 * emulates the browser: a capture listener registered before any router listener swallows the event that follows a
 * replaceState call that changed the hash. (The router installs its listener on first use, after this import.)
 */
let swallow = 0
const nativeReplaceState = history.replaceState.bind(history)
history.replaceState = (state: unknown, unused: string, url?: string | URL | null) => {
  const before = window.location.hash
  nativeReplaceState(state, unused, url)
  if (window.location.hash !== before) swallow++
}
window.addEventListener(
  'hashchange',
  (e) => {
    if (swallow > 0) {
      swallow--
      e.stopImmediatePropagation()
    }
  },
  true,
)

/** Lets happy-dom deliver pending hashchange events and Vue flush its queues. */
export async function settle(): Promise<void> {
  await new Promise((r) => setTimeout(r, 30))
  await nextTick()
  await nextTick()
}

/** Navigates like a user (assigning `location.hash`) and waits for the route to settle. */
export async function setHash(hash: string): Promise<void> {
  window.location.hash = hash
  await settle()
}

/** Resets the live address and the shared route state between tests, silently (no pending events left over). */
export async function resetRoute(hash = '#/'): Promise<void> {
  await settle()
  history.replaceState(null, '', hash)
  await settle()
  swallow = 0
  refreshRoute()
}
