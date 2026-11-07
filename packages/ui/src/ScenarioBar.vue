<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n, type ScenarioDef } from '@whz-ds-labs/lab-kit'

/** Ready-made scenarios of one tool as cards; the active one is pressed. Clicking a card asks the view to apply it. */
const props = defineProps<{ labId: string; scenarios: ScenarioDef[]; activeId: string | null }>()
const emit = defineEmits<{ apply: [scenario: ScenarioDef] }>()
const { t } = useI18n()

const root = ref<HTMLElement | null>(null)
const key = (s: ScenarioDef, part: 'title' | 'short') => `${props.labId}.scenario.${s.id}.${part}`
const state = computed(() => (props.scenarios.length > 0 ? 'ready' : 'empty'))

/** Moves the focus to the card of `id` (or the first card), e.g. after the note that held it was closed. */
function focusCard(id: string | null): void {
  const cards = root.value?.querySelectorAll<HTMLButtonElement>('button[data-scenario]')
  if (!cards) return
  const target = Array.from(cards).find((c) => c.dataset.scenario === id) ?? cards[0]
  target?.focus()
}
defineExpose({ focusCard })
</script>

<template>
  <div
    ref="root"
    class="scenario-bar"
    role="group"
    :aria-label="t('kit.scenario.barLabel')"
    data-verify-unit="scenario-bar"
    :data-verify-state="state"
    :data-verify-count="scenarios.length"
  >
    <button
      v-for="s in scenarios"
      :key="s.id"
      type="button"
      class="card"
      :class="{ on: s.id === activeId }"
      :data-scenario="s.id"
      :aria-pressed="s.id === activeId ? 'true' : 'false'"
      @click="emit('apply', s)"
    >
      <span class="card-title">{{ t(key(s, 'title')) }}</span>
      <span class="card-short">{{ t(key(s, 'short')) }}</span>
    </button>
  </div>
</template>

<style scoped>
.scenario-bar {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);
}
/* Cards sit on the card surface; the pressed one is filled with the accent instead of being outlined. */
.card {
  font: inherit;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  text-align: left;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 0;
  border-radius: var(--ds-radius-m);
  background: var(--ds-surface-card);
  color: var(--ds-text);
  cursor: pointer;
}
.card:hover {
  background: var(--ds-surface-area);
}
.card.on {
  background: var(--ds-accent);
  color: var(--ds-accent-contrast);
}
.card-title {
  font-weight: var(--ds-weight-strong);
}
.card-short {
  font-size: var(--ds-font-s);
  color: var(--ds-text-muted);
}
.card.on .card-short {
  color: var(--ds-accent-contrast);
}
@media (max-width: 767px) {
  .scenario-bar {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
