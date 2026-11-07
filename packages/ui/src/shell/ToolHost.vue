<script setup lang="ts">
import { ref } from 'vue'
import { useToolState, type LabDefinition, type ToolDefinition } from '@whz-ds-labs/lab-kit'
import ScenarioArea from '../ScenarioArea.vue'
import UrlNotice from '../UrlNotice.vue'

/**
 * One tool view wired to the address: state from the URL, writes back on `update:state`, scenario bar and note,
 * URL corrections. The shell keys it by `lab.id/tool.id`, so switching tools re-creates the view (the scenario
 * action timing relies on a fresh setup per route).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ lab: LabDefinition; tool: ToolDefinition<any> }>()

const inst = ref<{ runAction?: (name: string) => void } | null>(null)
const { state, setState, problems, scenario } = useToolState(props.lab.id, props.tool, (a) => inst.value?.runAction?.(a))
</script>

<template>
  <div class="tool-host" data-verify-unit="tool-host" data-verify-state="ready" :data-verify-tool="`${lab.id}/${tool.id}`">
    <ScenarioArea :lab-id="lab.id" :tool="tool" :scenario="scenario" />
    <UrlNotice :problems="problems" />
    <component :is="tool.component" ref="inst" :state="state" :lab-id="lab.id" @update:state="setState" />
  </div>
</template>

<style scoped>
.tool-host {
  display: grid;
  gap: var(--ds-space-3);
}
</style>
