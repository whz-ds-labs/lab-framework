<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { LabError, fmt, useI18n, verifyAttrs, type VerifyState } from '@whz-ds-labs/lab-kit'
import type { JobHandle } from '@whz-ds-labs/lab-kit/worker'
import { Formula, LinearSlider, PlotFrame, PointLayer, StatusPanel } from '@whz-ds-labs/ui'
import { generatePoints } from '../core/data'
import { fitLine, type Point } from '../core/fit'
import { lineClient } from '../worker/client'
import { MAX_PTS, X_RANGE, Y_RANGE, type LineState } from './state'

const props = defineProps<{ state: LineState; labId: string }>()
const emit = defineEmits<{ 'update:state': [s: LineState] }>()
const { t, lang } = useI18n(props.labId)
const seedId = useId()

const BOOTSTRAP_RESAMPLES = 1000

const generated = computed<Point[]>(() => generatePoints(props.state.n, props.state.noise, props.state.seed))
const points = computed<Point[]>(() => [...generated.value, ...props.state.pts])

const fit = computed(() => {
  try {
    return { ok: true as const, ...fitLine(points.value) }
  } catch (e) {
    return { ok: false as const, code: e instanceof LabError ? e.code : 'UNKNOWN' }
  }
})

// ---- state edits ---------------------------------------------------------------------------------------------------
const set = (patch: Partial<LineState>): void => emit('update:state', { ...props.state, ...patch })
const round2 = (v: number): number => (Math.round(v * 100) / 100 || 0) // `|| 0` turns -0 into 0
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v))
const toPoint = (p: { x: number; y: number }): Point => ({
  x: round2(clamp(p.x, X_RANGE.min, X_RANGE.max)),
  y: round2(clamp(p.y, Y_RANGE.min, Y_RANGE.max)),
})

const full = computed(() => props.state.pts.length >= MAX_PTS)

function addPoint(p: { x: number; y: number }): void {
  if (full.value) return // ignored at the maximum
  set({ pts: [...props.state.pts, toPoint(p)] })
}
const plotPanel = ref<HTMLElement | null>(null)
/** Keyboard way to add a point: at the plot center on the fitted line; the new point takes the focus (arrow keys move it). */
async function addPointAtCenter(): Promise<void> {
  if (full.value) return
  const x = (X_RANGE.min + X_RANGE.max) / 2
  addPoint({ x, y: fit.value.ok ? fit.value.intercept + fit.value.slope * x : (Y_RANGE.min + Y_RANGE.max) / 2 })
  await nextTick()
  const own = plotPanel.value?.querySelectorAll<SVGElement>('[data-layer="point"][tabindex="0"]')
  own?.[own.length - 1]?.focus()
}
function dragPoint(i: number, p: { x: number; y: number }): void {
  set({ pts: props.state.pts.map((q, j) => (j === i ? toPoint(p) : q)) })
}
function removePoint(i: number): void {
  set({ pts: props.state.pts.filter((_, j) => j !== i) })
}
function setSeed(e: Event): void {
  const input = e.target as HTMLInputElement
  const v = Number(input.value)
  if (input.value.trim() !== '' && Number.isInteger(v) && v >= 0 && v <= 9999) set({ seed: v })
  else input.value = String(props.state.seed) // not a valid seed: show the current one again
}

// ---- bootstrap interval --------------------------------------------------------------------------------------------
// Runs in a worker on request (button or scenario action), never on every edit; a newer run, a cancel or any change of
// the data cancels the older one (its promise rejects with CANCELLED and is ignored via the run counter).
const bs = ref<VerifyState>('empty')
const ci = ref<{ lo: number; hi: number } | null>(null)
const bsError = ref('')
const runs = ref(0) // runs started in this view (exposed as data-verify-count)
let runId = 0
let handle: JobHandle<{ lo: number; hi: number }> | null = null

function stopRun(): void {
  runId++
  handle?.cancel()
  handle = null
}

function failRun(code: string): void {
  bs.value = 'error'
  bsError.value = code
}

function runBootstrap(): void {
  if (!fit.value.ok) return
  stopRun()
  const mine = runId
  runs.value++
  bs.value = 'loading'
  ci.value = null
  bsError.value = ''
  try {
    handle = lineClient.start({ kind: 'bootstrap', points: points.value, B: BOOTSTRAP_RESAMPLES, seed: props.state.seed })
    handle.promise
      .then((r) => {
        if (mine !== runId) return
        handle = null
        ci.value = r
        bs.value = 'ready'
      })
      .catch((e: unknown) => {
        // CANCELLED means a newer run or a reset replaced this one.
        if (mine !== runId || (e instanceof LabError && e.code === 'CANCELLED')) return
        handle = null
        failRun(e instanceof LabError ? e.code : 'UNKNOWN')
      })
  } catch (e) {
    handle = null
    failRun(e instanceof LabError ? e.code : 'UNKNOWN') // a synchronous throw of start()
  }
}

function cancelBootstrap(): void {
  stopRun()
  bs.value = 'empty'
}

// A result belongs to the data it was computed from: any change of the data discards it. The same data adopted again
// (re-applied scenario) keeps it until the action starts the next run.
const dataKey = computed(() => JSON.stringify([props.state.n, props.state.noise, props.state.seed, props.state.pts]))
watch(dataKey, () => {
  stopRun()
  bs.value = 'empty'
  ci.value = null
  bsError.value = ''
})

function runAction(name: string): void {
  if (name === 'bootstrap') runBootstrap()
}
defineExpose({ runAction })

onBeforeUnmount(() => {
  stopRun()
  lineClient.dispose()
})

// ---- view helpers --------------------------------------------------------------------------------------------------
const fitAttrs = computed(() =>
  fit.value.ok
    ? verifyAttrs('line-fit', 'ready', { count: points.value.length })
    : verifyAttrs('line-fit', 'error', { error: fit.value.code }),
)
const plotAttrs = computed(() => verifyAttrs('line-plot', 'ready', { count: points.value.length }))
const bsAttrs = computed(() => verifyAttrs('bootstrap', bs.value, { count: runs.value, error: bsError.value }))

/** ŷ = a + b·x with the displayed decimals; the decimal comma is wrapped for TeX. */
const tex = computed(() => {
  if (!fit.value.ok) return ''
  const num = (v: number): string => fmt(lang.value, Math.abs(v), 3).replace(',', '{,}')
  const { intercept, slope } = fit.value
  return `\\hat{y} = ${intercept < 0 ? '-' : ''}${num(intercept)} ${slope < 0 ? '-' : '+'} ${num(slope)} \\cdot x`
})

const genX = computed(() => generated.value.map((p) => p.x))
const genY = computed(() => generated.value.map((p) => p.y))
const ownX = computed(() => props.state.pts.map((p) => p.x))
const ownY = computed(() => props.state.pts.map((p) => p.y))
const noiseFormat = (v: number): string => fmt(lang.value, v, 1)
</script>

<template>
  <div class="line-tool">
    <div class="main">
      <section ref="plotPanel" class="panel" v-bind="plotAttrs">
        <h2>{{ t('line.plot.title') }}</h2>
        <PlotFrame
          :x-domain="[X_RANGE.min, X_RANGE.max]"
          :y-domain="[Y_RANGE.min, Y_RANGE.max]"
          x-label="x"
          y-label="y"
          @plot-click="addPoint"
        >
          <template #default="{ x, y }">
            <line
              v-if="fit.ok"
              class="fit-line"
              :x1="x(X_RANGE.min)"
              :y1="y(fit.intercept + fit.slope * X_RANGE.min)"
              :x2="x(X_RANGE.max)"
              :y2="y(fit.intercept + fit.slope * X_RANGE.max)"
            />
            <PointLayer :x="genX" :y="genY" :editable="false" />
            <PointLayer
              :x="ownX"
              :y="ownY"
              :label="t('line.userPoint')"
              @point-drag="dragPoint"
              @point-remove="removePoint"
            />
          </template>
        </PlotFrame>
        <div class="row">
          <p class="hint">{{ full ? t('line.click.full') : t('line.click.hint') }}</p>
          <button type="button" class="ds-btn" data-action="add-point" :disabled="full" @click="addPointAtCenter">
            {{ t('line.add') }}
          </button>
          <button
            type="button"
            class="ds-btn"
            data-action="reset-points"
            :disabled="state.pts.length === 0"
            @click="set({ pts: [] })"
          >
            {{ t('line.reset') }}
          </button>
        </div>
      </section>
    </div>

    <div class="side">
      <section class="panel">
        <div data-param="n">
          <LinearSlider
            :model-value="state.n"
            :min="3"
            :max="200"
            :step="1"
            :label="t('line.n.label')"
            @update:model-value="(n) => set({ n })"
          />
        </div>
        <div data-param="noise">
          <LinearSlider
            :model-value="state.noise"
            :min="0"
            :max="5"
            :step="0.1"
            :label="t('line.noise.label')"
            :format="noiseFormat"
            @update:model-value="(noise) => set({ noise })"
          />
        </div>
        <div class="field" data-param="seed">
          <label :for="seedId">{{ t('line.seed.label') }}</label>
          <input :id="seedId" class="seed" type="number" min="0" max="9999" step="1" :value="state.seed" @change="setSeed" />
        </div>
      </section>

      <section class="panel" v-bind="fitAttrs">
        <h2>{{ t('line.formula.title') }}</h2>
        <p v-if="!fit.ok" class="error" role="alert">{{ t(`line.error.${fit.code}`) }}</p>
        <template v-else>
          <p class="formula"><Formula :tex="tex" /></p>
          <dl class="result">
            <dt>{{ t('line.slope') }}</dt>
            <dd data-testid="slope">{{ fmt(lang, fit.slope, 3) }}</dd>
            <dt>{{ t('line.intercept') }}</dt>
            <dd data-testid="intercept">{{ fmt(lang, fit.intercept, 3) }}</dd>
            <dt>{{ t('line.r2') }}</dt>
            <dd data-testid="r2">{{ fmt(lang, fit.r2, 3) }}</dd>
          </dl>
        </template>
      </section>

      <section class="panel" v-bind="bsAttrs">
        <h2>{{ t('line.bootstrap.title') }}</h2>
        <div class="row">
          <button type="button" class="ds-btn primary" data-action="bootstrap" :disabled="!fit.ok" @click="runBootstrap">
            {{ t('line.bootstrap.label') }}
          </button>
          <button v-if="bs === 'loading'" type="button" class="ds-btn" data-action="bootstrap-cancel" @click="cancelBootstrap">
            {{ t('line.bootstrap.cancel') }}
          </button>
        </div>
        <StatusPanel v-if="bs === 'loading'" state="loading" />
        <StatusPanel v-else-if="bs === 'error'" state="error" :message="t('line.ciError')" />
        <dl v-else-if="bs === 'ready' && ci" class="result">
          <dt>{{ t('line.bootstrap.result') }}</dt>
          <dd data-testid="ci">[{{ fmt(lang, ci.lo, 3) }}; {{ fmt(lang, ci.hi, 3) }}]</dd>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.line-tool {
  display: grid;
  gap: var(--ds-space-4);
  align-items: start;
}
@media (min-width: 1100px) {
  .line-tool {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}
.main,
.side {
  display: grid;
  gap: var(--ds-space-4);
  min-width: 0;
}
.panel {
  display: grid;
  gap: var(--ds-space-3);
  background: var(--ds-surface-card);
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-m);
  min-width: 0;
}
h2 {
  margin: 0;
  font-size: var(--ds-font-l);
  font-weight: var(--ds-weight-strong);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
}
.hint {
  margin: 0;
  color: var(--ds-text-muted);
  font-size: var(--ds-font-s);
}
.fit-line {
  stroke: var(--ds-accent);
  stroke-width: 2.5;
  pointer-events: none;
}
.field {
  display: grid;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-s);
}
.seed {
  box-sizing: border-box;
  width: 8rem;
  min-height: var(--ds-hit);
  padding: var(--ds-space-1) var(--ds-space-3);
  font: inherit;
  /* ds-labs-allow: input field border */
  border: 1px solid var(--ds-input-border);
  border-radius: var(--ds-radius-s);
  background: var(--ds-surface-card);
  color: var(--ds-text);
}
.formula {
  margin: 0;
  overflow-x: auto;
  font-size: var(--ds-font-l);
}
.result {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
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
