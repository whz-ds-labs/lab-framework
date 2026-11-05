/**
 * State of one tool view: the typed state parsed from the address, written back with `replaceState` (no
 * `hashchange`, no history entry) and re-parsed when the route changes (nav link, back/forward, scenario).
 * Replaces the per-view wiring of the DT Labs views (adoptQuery, query watcher, route watcher, useScenario).
 */
import { computed, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import type { ToolDefinition } from './define'
import { routeNames, useRoute } from './router'
import { writeToolQuery } from './url'
import { useScenario, type ScenarioApi } from './useScenario'

export function useToolState<S>(
  labId: string,
  tool: ToolDefinition<S>,
  runAction: (action: string) => void,
): { state: Ref<S>; setState(next: S): void; problems: ComputedRef<string[]>; scenario: ScenarioApi } {
  const route = useRoute()
  const urlProblems = shallowRef<string[]>([])

  function parseRoute(): { state: S; problems: string[] } {
    // A route that does not name this tool gives the defaults (and no problems) instead of foreign parameters.
    return tool.parse(routeNames(route.value, labId, tool.id) ? Object.fromEntries(route.value.params) : {})
  }

  const initial = parseRoute()
  // shallow: setState replaces the whole state, so the tool's own objects stay raw
  const state = shallowRef(initial.state) as Ref<S>
  urlProblems.value = initial.problems

  // Registered before useScenario, so the state is adopted before the scenario action is scheduled. A new route
  // object (hashchange, refreshRoute) restarts from the address; our own URL updates never touch the route ref.
  watch(
    () => route.value,
    () => {
      if (!routeNames(route.value, labId, tool.id)) return
      const r = parseRoute()
      state.value = r.state
      urlProblems.value = r.problems
    },
  )

  const scenario = useScenario(labId, tool, () => tool.toQuery(state.value), runAction)

  function setState(next: S): void {
    state.value = next
    writeToolQuery(labId, tool, tool.toQuery(next))
  }

  const problems = computed(() => [...new Set([...urlProblems.value, ...scenario.problems.value])])

  return { state, setState, problems, scenario }
}
