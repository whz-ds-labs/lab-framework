<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n, type ScenarioDef } from '@whz-ds-labs/lab-kit'

/**
 * Explanation box of the active scenario. The box stays in the DOM (hidden when there is no scenario) but is no live
 * region: a hidden region is not in the accessibility tree, so un-hiding it and filling it in one render would go
 * unannounced, and an atomic box would be re-read on every deviation or language change. A permanent visually hidden
 * sibling announces only the title (plus the deviation hint while deviated).
 */
const props = defineProps<{ labId: string; scenario: ScenarioDef | null; deviated: boolean }>()
const emit = defineEmits<{ close: []; restore: [] }>()
const { t } = useI18n()

const key = (part: 'title' | 'see' | 'watch' | 'next') => `${props.labId}.scenario.${props.scenario?.id}.${part}`
// The announcement is a snapshot: it changes only when the scenario or the deviation changes, never on a language
// toggle (the title is re-read then, but the box text stays reactive).
const announcement = ref('')
watch(
  () => [props.scenario?.id ?? null, props.deviated] as const,
  () => {
    announcement.value =
      props.scenario === null ? '' : props.deviated ? `${t(key('title'))} ${t('kit.scenario.changed')}` : t(key('title'))
  },
  { immediate: true },
)
const titleEl = ref<HTMLElement | null>(null)
/** Moves the focus to the title, e.g. after "restore" removed the button that held it. */
function focusTitle(): void {
  titleEl.value?.focus()
}
defineExpose({ focusTitle })
const sections = computed(() =>
  props.scenario === null
    ? []
    : [
        { label: t('kit.scenario.noteSee'), text: t(key('see')) },
        { label: t('kit.scenario.noteWatch'), text: t(key('watch')) },
        { label: t('kit.scenario.noteNext'), text: t(key('next')) },
      ],
)
</script>

<template>
  <div class="scenario-note-wrap">
    <section
      class="scenario-note"
      data-verify-unit="scenario-note"
      :data-verify-state="scenario ? 'ready' : 'empty'"
      :data-verify-scenario="scenario?.id ?? ''"
      :data-verify-deviated="scenario !== null && deviated ? 'true' : 'false'"
      :hidden="scenario === null"
    >
      <div v-if="scenario" class="box">
        <button
          type="button"
          class="close"
          data-action="close"
          :aria-label="t('kit.scenario.close')"
          @click="emit('close')"
        >
          <span aria-hidden="true">×</span>
        </button>
        <h3 ref="titleEl" class="note-title" tabindex="-1">{{ t(key('title')) }}</h3>
        <div class="sections">
          <div v-for="sec in sections" :key="sec.label" class="section">
            <h4>{{ sec.label }}</h4>
            <p>{{ sec.text }}</p>
          </div>
        </div>
        <p v-if="deviated" class="changed">
          <span>{{ t('kit.scenario.changed') }}</span>
          <button type="button" class="ds-btn small" data-action="restore" @click="emit('restore')">
            {{ t('kit.scenario.restore') }}
          </button>
        </p>
      </div>
    </section>
    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </div>
</template>

<style scoped>
/* The note is an area-level surface; no edge lines, spacing and the surface step carry the structure. */
.box {
  position: relative;
  background: var(--ds-surface-area);
  color: var(--ds-text);
  padding: var(--ds-space-3) calc(var(--ds-hit) + var(--ds-space-2)) var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-m);
  margin: var(--ds-space-3) 0 0;
}
.close {
  position: absolute;
  top: var(--ds-space-1);
  right: var(--ds-space-1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: inherit;
  font-size: var(--ds-font-l);
  line-height: 1;
  width: var(--ds-hit);
  height: var(--ds-hit);
  padding: 0;
  border: 0;
  border-radius: var(--ds-radius-m);
  background: transparent;
  color: var(--ds-text-muted);
  cursor: pointer;
}
.close:hover {
  background: var(--ds-surface-card);
  color: var(--ds-text);
}
.note-title {
  margin: 0 0 var(--ds-space-2);
  font-size: var(--ds-font-l);
}
.sections {
  display: grid;
  gap: var(--ds-space-2) var(--ds-space-4);
}
@media (min-width: 960px) {
  .sections {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
h4 {
  margin: 0;
  font-size: var(--ds-font-s);
  color: var(--ds-text-muted);
}
.section p {
  margin: var(--ds-space-1) 0 0;
}
.changed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
  margin: var(--ds-space-4) 0 0;
  color: var(--ds-warn);
  font-weight: var(--ds-weight-strong);
}
</style>
