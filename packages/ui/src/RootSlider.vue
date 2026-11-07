<script setup lang="ts">
import { computed, useId } from 'vue'

/**
 * Like LinearSlider, but the slider position p in [0, 1] maps to value = min + (max - min) * p^2, so small values
 * (e.g. ccp_alpha) are easy to set. The emitted value is rounded to `decimals` places (default 3), which keeps
 * textbook values such as 0.2, 0.45 and 0.6 reachable as exact numbers.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min: number
    max: number
    label: string
    decimals?: number
    /** Display text of the value (default: the number as is). */
    format?: (v: number) => string
  }>(),
  { decimals: 3 },
)
const emit = defineEmits<{ 'update:modelValue': [v: number] }>()
const id = useId()

const STEPS = 2000
const position = computed(() => {
  const span = props.max - props.min
  if (!(span > 0)) return 0
  return Math.sqrt(Math.min(1, Math.max(0, (props.modelValue - props.min) / span)))
})

function onInput(e: Event) {
  const p = Number((e.target as HTMLInputElement).value)
  if (!Number.isFinite(p)) return
  const q = Math.min(1, Math.max(0, p))
  const raw = props.min + (props.max - props.min) * q * q
  const scale = 10 ** props.decimals
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, Math.round(raw * scale) / scale)))
}
</script>

<template>
  <div class="slider" data-slider="root">
    <div class="head">
      <label :for="id" class="label">{{ label }}</label>
      <output :for="id" class="value">{{ format ? format(modelValue) : modelValue }}</output>
    </div>
    <input
      :id="id"
      type="range"
      min="0"
      max="1"
      :step="1 / STEPS"
      :value="position"
      :aria-valuetext="format ? format(modelValue) : String(modelValue)"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.slider {
  margin: var(--ds-space-2) 0;
}
.head {
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  font-size: var(--ds-font-s);
}
.value {
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
}
input {
  width: 100%;
  min-height: var(--ds-hit);
  accent-color: var(--ds-accent);
}
/* The focus ring comes from base.css (input:focus-visible). */
</style>
