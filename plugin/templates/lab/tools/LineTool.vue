<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { LabError, fmt, useI18n, verifyAttrs } from '@whz-ds-labs/lab-kit'
import { LinearSlider } from '@whz-ds-labs/ui'
import { generatePoints } from '../core/data'
import { fitLine, type Point } from '../core/fit'
import { lineClient } from '../worker/client'
import type { LineState } from './state'

// Minimal tool of the example lab; the plot, point editing and scenarios are added on top of this.
const props = defineProps<{ state: LineState; labId: string }>()
const emit = defineEmits<{ 'update:state': [s: LineState] }>()
const { t, lang } = useI18n(props.labId)

const points = computed<Point[]>(() => [...generatePoints(props.state.n, props.state.noise, props.state.seed), ...props.state.pts])

const fit = computed(() => {
  try {
    return { ok: true as const, ...fitLine(points.value) }
  } catch (e) {
    return { ok: false as const, code: e instanceof LabError ? e.code : 'UNKNOWN' }
  }
})

const ci = ref<{ lo: number; hi: number } | null>(null)
let ciRun = 0

// The bootstrap interval runs in a worker; a newer run cancels the older one (its promise rejects with CANCELLED).
watch(
  points,
  (pts) => {
    const run = ++ciRun
    ci.value = null
    if (!fit.value.ok) return
    lineClient
      .start({ kind: 'bootstrap', points: pts, B: 500, seed: props.state.seed })
      .promise.then((r) => {
        if (run === ciRun) ci.value = r
      })
      .catch(() => {
        // CANCELLED by a newer run, or no worker available: the interval stays hidden.
      })
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  ciRun++
  lineClient.dispose()
})

const attrs = computed(() =>
  fit.value.ok
    ? verifyAttrs('line-fit', 'ready', { count: points.value.length })
    : verifyAttrs('line-fit', 'error', { error: fit.value.code }),
)

function setN(n: number): void {
  emit('update:state', { ...props.state, n })
}
</script>

<template>
  <section class="line-tool" v-bind="attrs">
    <LinearSlider :model-value="state.n" :min="3" :max="200" :step="1" :label="t('line.n.label')" @update:model-value="setN" />
    <p v-if="!fit.ok" class="error" role="alert">{{ t(`line.error.${fit.code}`) }}</p>
    <dl v-else class="result">
      <dt>{{ t('line.slope') }}</dt>
      <dd data-testid="slope">{{ fmt(lang, fit.slope, 3) }}</dd>
      <dt>{{ t('line.intercept') }}</dt>
      <dd data-testid="intercept">{{ fmt(lang, fit.intercept, 3) }}</dd>
      <dt>{{ t('line.r2') }}</dt>
      <dd data-testid="r2">{{ fmt(lang, fit.r2, 3) }}</dd>
      <template v-if="ci">
        <dt>{{ t('line.ci') }}</dt>
        <dd data-testid="ci">[{{ fmt(lang, ci.lo, 3) }}; {{ fmt(lang, ci.hi, 3) }}]</dd>
      </template>
    </dl>
  </section>
</template>

<style scoped>
.line-tool {
  display: grid;
  gap: var(--ds-space-3);
  background: var(--ds-surface-card);
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-m);
}
.result {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--ds-space-1) var(--ds-space-4);
  margin: 0;
}
.result dt {
  color: var(--ds-text-muted);
}
.result dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}
.error {
  background: var(--ds-error-bg);
  color: var(--ds-text);
  padding: var(--ds-space-3);
  border-radius: var(--ds-radius-s);
  margin: 0;
}
</style>
