import { ref, type Ref } from 'vue'
import { sharedState } from './state'

export interface Notice {
  id: number
  /** Full message key (`kit.…` or `<labId>.…`). */
  key: string
  vars?: Record<string, string | number>
}

// The list lives in the shared state, so a duplicated copy of lab-kit still shows one list.
const store = sharedState('notices', () => ({ list: ref<Notice[]>([]) as Ref<Notice[]>, nextId: 1 }))

/** Shows a notice for a full message key; the same key is shown at most once at a time. */
export function notify(key: string, vars?: Record<string, string | number>): void {
  if (store.list.value.some((n) => n.key === key)) return
  store.list.value.push({ id: store.nextId++, key, vars })
}

export function dismissNotice(id: number): void {
  store.list.value = store.list.value.filter((n) => n.id !== id)
}

export function useNotices(): Ref<Notice[]> {
  return store.list
}
