<script setup lang="ts">
import { useI18n } from '@whz-ds-labs/lab-kit'

/** Horizontal bars; the width is `value / max` (default max 1, e.g. importances that sum to 1). `format` renders the value text (default: 3 decimals). */
withDefaults(
  defineProps<{ items: { label: string; value: number }[]; max?: number; format?: (v: number) => string }>(),
  { max: 1, format: (v: number) => v.toFixed(3) },
)
const { t } = useI18n()

function pct(value: number, max: number): string {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return `${(share * 100).toFixed(1).replace(/\.0$/, '')}%`
}
</script>

<template>
  <div
    class="bar-list"
    data-verify-unit="bar-list"
    :data-verify-state="items.length === 0 ? 'empty' : 'ready'"
    :data-verify-count="items.length"
  >
    <p v-if="items.length === 0" class="empty">{{ t('kit.status.empty') }}</p>
    <ul v-else>
      <li v-for="(it, i) in items" :key="i">
        <span class="label">{{ it.label }}</span>
        <span class="track" aria-hidden="true">
          <span class="bar" :data-bar="i" :style="{ width: pct(it.value, max) }" />
        </span>
        <span class="value">{{ format(it.value) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
li {
  display: grid;
  grid-template-columns: minmax(4rem, 10rem) 1fr 3.5rem;
  gap: var(--ds-space-2);
  align-items: center;
  margin: var(--ds-space-1) 0;
  font-size: var(--ds-font-s);
}
.label {
  overflow-wrap: anywhere;
}
/* The track is the area surface (one level below a card); the bar is the accent. */
.track {
  background: var(--ds-surface-area);
  height: 0.9rem;
  border-radius: var(--ds-radius-s);
  overflow: hidden;
}
.bar {
  display: block;
  height: 100%;
  background: var(--ds-accent);
}
.value {
  font-variant-numeric: tabular-nums;
  color: var(--ds-text-muted);
  text-align: right;
}
.empty {
  color: var(--ds-text-muted);
}
</style>
