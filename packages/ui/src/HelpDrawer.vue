<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { applyScenario, localized, scenarioHref, useI18n, type ScenarioDef, type ToolDefinition } from '@whz-ds-labs/lab-kit'
import RefBadge from './RefBadge.vue'
import { useNarrowViewport } from './viewport'

/**
 * Help drawer of the open tool (onboarding): purpose, how to read each panel, what each control does, the course
 * reference and the tool's scenarios. Closed, it stays in the DOM (`hidden`, contract `empty`). Escape closes it
 * only while the focus is inside (the listener sits on the drawer itself). Below 768 px it fills the screen and is
 * modal (dialog semantics; the shell makes the page inert) and a scenario link closes it, so the result is visible;
 * on wide screens it is a non-modal 360 px side panel that stays open.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const props = defineProps<{ labId: string; tool: ToolDefinition<any> | null; open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { lang, t } = useI18n()
const narrow = useNarrowViewport()

const root = ref<HTMLElement | null>(null)
const headingEl = ref<HTMLElement | null>(null)

const visible = computed(() => props.open && props.tool !== null)
const toolName = computed(() => (props.tool ? localized(props.tool.title) : ''))
const text = (part: 'purpose' | `read.${string}` | `controls.${string}`) =>
  t(`${props.labId}.${props.tool?.id}.help.${part}`)
const scenarioTitle = (s: ScenarioDef) => t(`${props.labId}.scenario.${s.id}.title`)

// Opening moves the focus to the heading (a wide drawer is not a focus trap); a fresh tool starts at the top.
watch(visible, async (v) => {
  if (!v) return
  await nextTick()
  headingEl.value?.focus()
})
watch(
  () => props.tool?.id,
  () => {
    if (root.value) root.value.scrollTop = 0
  },
)

function onScenario(tool: ToolDefinition<any>, s: ScenarioDef): void {
  applyScenario(props.labId, tool, s)
  if (narrow.value) emit('close')
}
</script>

<template>
  <aside
    id="help-drawer"
    ref="root"
    class="help"
    :class="{ narrow }"
    :hidden="!visible"
    :role="visible && narrow ? 'dialog' : undefined"
    :aria-modal="visible && narrow ? 'true' : undefined"
    :aria-labelledby="visible ? 'help-title' : undefined"
    data-verify-unit="help"
    :data-verify-state="visible ? 'ready' : 'empty'"
    :data-verify-tool="tool?.id ?? undefined"
    @keydown.esc="emit('close')"
  >
    <template v-if="visible && tool">
      <header class="bar">
        <h2 id="help-title" ref="headingEl" tabindex="-1">{{ t('kit.help.heading', { tool: toolName }) }}</h2>
        <button
          type="button"
          class="x"
          data-action="help-close"
          :aria-label="t('kit.help.close')"
          @click="emit('close')"
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div class="body">
        <section data-help="purpose" aria-labelledby="help-purpose-title">
          <h3 id="help-purpose-title" class="label">{{ t('kit.help.purposeTitle') }}</h3>
          <p class="lead">{{ text('purpose') }}</p>
        </section>

        <section data-help="read" aria-labelledby="help-read-title">
          <h3 id="help-read-title" class="label">{{ t('kit.help.readTitle') }}</h3>
          <ul class="rows">
            <li v-for="r in tool.help.read" :key="r.key" :data-help-key="r.key">
              <strong>{{ t(`${labId}.${r.title}`) }}</strong>
              <span>{{ text(`read.${r.key}`) }}</span>
            </li>
          </ul>
        </section>

        <section data-help="controls" aria-labelledby="help-controls-title">
          <h3 id="help-controls-title" class="label">{{ t('kit.help.controlsTitle') }}</h3>
          <ul class="rows">
            <li v-for="c in tool.help.controls" :key="c.key" :data-help-key="c.key">
              <strong>{{ typeof c.label === 'string' ? t(`${labId}.${c.label}`) : c.label.literal }}</strong>
              <span>{{ text(`controls.${c.key}`) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="tool.refs" data-help="course" aria-labelledby="help-course-title">
          <h3 id="help-course-title" class="label">{{ t('kit.help.courseTitle') }}</h3>
          <RefBadge :chapter="tool.refs.chapter" :code="tool.refs.code" />
        </section>

        <section v-if="tool.scenarios.length > 0" data-help="scenarios" aria-labelledby="help-scenarios-title">
          <h3 id="help-scenarios-title" class="label">{{ t('kit.help.scenariosTitle') }}</h3>
          <p class="hint">{{ t('kit.help.scenariosHint') }}</p>
          <ul class="links">
            <li v-for="s in tool.scenarios" :key="s.id">
              <a
                class="ds-pill"
                :href="scenarioHref(labId, tool, s, lang)"
                :data-help-scenario="s.id"
                @click.prevent="onScenario(tool, s)"
                >{{ scenarioTitle(s) }}</a
              >
            </li>
          </ul>
        </section>
      </div>
    </template>
  </aside>
</template>

<style scoped>
/* The drawer is a card-level surface above the page; the surface step alone (no line, no shadow) sets it off from the page. */
.help {
  position: fixed;
  z-index: 30;
  top: var(--help-top, 3rem);
  right: 0;
  width: 360px;
  max-width: 100%;
  height: calc(100dvh - var(--help-top, 3rem));
  box-sizing: border-box;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--ds-surface-card);
  color: var(--ds-text);
}
/* `display` rules below must not undo the hidden attribute. */
.help[hidden] {
  display: none;
}
/* Below 768 px the drawer takes the whole screen, header included, and acts like a dialog. */
.help.narrow {
  top: 0;
  width: 100%;
  height: 100dvh;
}

.bar {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  padding: var(--ds-space-3) var(--ds-space-3) var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-area);
}
h2 {
  margin: 0;
  font-size: var(--ds-font-l);
  font-weight: var(--ds-weight-strong);
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.x {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ds-hit);
  height: var(--ds-hit);
  padding: 0;
  font: inherit;
  font-size: var(--ds-font-xl);
  line-height: 1;
  border: 0;
  border-radius: var(--ds-radius-m);
  background: var(--ds-surface-card);
  color: var(--ds-text);
  cursor: pointer;
}
.x:hover {
  color: var(--ds-accent);
}

.body {
  display: grid;
  gap: var(--ds-space-5);
  padding: var(--ds-space-4) var(--ds-space-4) var(--ds-space-5);
}
.label {
  margin: 0 0 var(--ds-space-2);
  font-size: var(--ds-font-s);
  font-weight: var(--ds-weight-strong);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}
p {
  margin: 0;
}
.lead {
  line-height: 1.55;
}
.hint {
  margin-bottom: var(--ds-space-2);
  font-size: var(--ds-font-s);
  line-height: 1.5;
  color: var(--ds-text-muted);
}

/* Name above its explanation; entries are separated by spacing only. */
.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ds-space-3);
}
.rows li {
  display: grid;
  gap: var(--ds-space-1);
  font-size: var(--ds-font-s);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.rows strong {
  font-weight: var(--ds-weight-strong);
}
.rows span {
  color: var(--ds-text-muted);
}

.links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ds-space-2);
}
.links a {
  display: flex;
  border-radius: var(--ds-radius-m);
  font-weight: var(--ds-weight-strong);
  font-size: var(--ds-font-s);
}
</style>
