<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  modelValue: number
  min: number
  max: number
  step: number
  label: string
  /** Display text of the value (default: the number as is). */
  format?: (v: number) => string
}>()
const emit = defineEmits<{ 'update:modelValue': [v: number] }>()
const id = useId()

function onInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  if (Number.isFinite(v)) emit('update:modelValue', v)
}
</script>

<template>
  <div class="slider" data-slider="linear">
    <div class="head">
      <label :for="id" class="label">{{ label }}</label>
      <output :for="id" class="value">{{ format ? format(modelValue) : modelValue }}</output>
    </div>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
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
