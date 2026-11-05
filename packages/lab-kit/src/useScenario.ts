/**
 * Scenario state of one tool view (onboarding): which scenario the address names, whether the user deviated from
 * it, and the one-off start action.
 *
 * Action timing: the view adopts the address in its own route watcher / setup code. The action must see that adopted
 * state, so it runs after `await nextTick()`: called inside a flush, nextTick resolves only after the whole flush
 * (all pre-flush watchers, whatever their registration order, the render and post hooks); called in setup, after
 * the mount. It runs exactly once per adoption because
 *  - setup covers cold loads and cross-route navigation (the view is created fresh for the new route),
 *  - the route watcher is not `immediate`, so it does not repeat the setup run, and fires once per new route object
 *    (`hashchange` or `refreshRoute`),
 *  - writeToolQuery / removeScenarioParam / toggleLang use replaceState and never touch the route ref.
 */
import { computed, getCurrentScope, nextTick, onScopeDispose, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import type { ScenarioDef, ToolDefinition } from './define'
import type { Query } from './query'
import { refreshRoute, routeNames, sameHash, useRoute } from './router'
import { isDeviated, parseScenarioParam, scenarioHref } from './scenarios'
import { removeScenarioParam } from './url'

/* eslint-disable @typescript-eslint/no-explicit-any -- tools of any state type */

/**
 * Applies a scenario from anywhere (bar, note, help drawer): sets the address; when it is already identical (in any
 * parameter order), re-reads it instead, so the view adopts it again and the action runs again.
 */
export function applyScenario(labId: string, tool: ToolDefinition<any>, s: ScenarioDef): void {
  if (typeof window === 'undefined') return
  const live = window.location.hash
  const lang = new URLSearchParams(live.split('?')[1] ?? '').get('lang') ?? undefined
  const target = scenarioHref(labId, tool, s, lang)
  if (sameHash(target, live)) refreshRoute()
  else window.location.hash = target
}

export interface ScenarioApi {
  active: Ref<ScenarioDef | null>
  deviated: ComputedRef<boolean>
  problems: Ref<string[]>
  apply: (s: ScenarioDef) => void
  dismiss: () => void
  restore: () => void
}

export function useScenario(
  labId: string,
  tool: ToolDefinition<any>,
  currentQuery: () => Query,
  runAction: (action: string) => void,
): ScenarioApi {
  const route = useRoute()
  // shallow: the definition objects stay raw, so identity checks against them hold
  const active: Ref<ScenarioDef | null> = shallowRef(null)
  const problems = ref<string[]>([])
  let disposed = false
  if (getCurrentScope()) onScopeDispose(() => (disposed = true))

  /** Reads `scenario` from the route; returns the scenario whose action is due (or null). */
  function adopt(): ScenarioDef | null {
    // A route of another tool belongs to the next view; this one is about to unmount.
    if (!routeNames(route.value, labId, tool.id)) return null
    const r = parseScenarioParam(tool, Object.fromEntries(route.value.params))
    active.value = r.scenario
    problems.value = r.problems
    return r.scenario
  }

  async function runAfterAdoption(s: ScenarioDef | null): Promise<void> {
    if (s?.action === undefined) return
    await nextTick()
    // Skip when the view is gone or the scenario was dismissed / replaced in the meantime.
    if (disposed || active.value !== s) return
    runAction(s.action)
  }

  void runAfterAdoption(adopt())
  watch(
    () => route.value,
    () => void runAfterAdoption(adopt()),
  )

  const deviated = computed(() => active.value !== null && isDeviated(tool, active.value, currentQuery()))

  const apply = (s: ScenarioDef): void => applyScenario(labId, tool, s)

  function dismiss(): void {
    active.value = null
    removeScenarioParam()
  }

  function restore(): void {
    if (active.value) apply(active.value)
  }

  return { active, deviated, problems, apply, dismiss, restore }
}
