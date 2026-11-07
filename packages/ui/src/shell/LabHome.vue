<script setup lang="ts">
import { buildHash, localized, scenarioHref, useI18n, verifyAttrs, type LabDefinition } from '@whz-ds-labs/lab-kit'
import RefBadge from '../RefBadge.vue'

/** Start page of a lab: one tile per tool with summary, course reference and links to its ready-made scenarios. */
defineProps<{ lab: LabDefinition }>()
const { t } = useI18n()
</script>

<template>
  <div class="home" v-bind="verifyAttrs('lab-home', 'ready', { count: lab.tools.length })">
    <header class="head">
      <h2 class="title">{{ localized(lab.title) }}</h2>
      <p class="lead">{{ localized(lab.summary) }}</p>
    </header>

    <section aria-labelledby="lab-tools-title">
      <h3 id="lab-tools-title" class="label">{{ t('kit.home.toolsTitle') }}</h3>
      <ul class="tiles">
        <li v-for="tool in lab.tools" :key="tool.id" class="tile" :data-tool-tile="tool.id">
          <h4 class="tile-title">
            <a :href="buildHash({ lab: lab.id, tool: tool.id })">{{ localized(tool.title) }}</a>
          </h4>
          <p class="summary">{{ localized(tool.summary) }}</p>
          <RefBadge v-if="tool.refs" class="badge" :chapter="tool.refs.chapter" :code="tool.refs.code" />
          <div v-if="tool.scenarios.length > 0" class="scenarios">
            <span class="scenarios-label">{{ t('kit.home.scenarios') }}</span>
            <a
              v-for="s in tool.scenarios"
              :key="s.id"
              class="ds-pill"
              :data-scenario-link="s.id"
              :href="scenarioHref(lab.id, tool, s)"
              >{{ t(`${lab.id}.scenario.${s.id}.title`) }}</a
            >
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: grid;
  gap: var(--ds-space-6);
}
.title {
  margin: 0;
  font-size: var(--ds-font-xl);
  font-weight: var(--ds-weight-strong);
  line-height: 1.2;
}
.lead {
  margin: var(--ds-space-2) 0 0;
  max-width: 64ch;
  color: var(--ds-text-muted);
  line-height: 1.55;
}
.label {
  margin: 0 0 var(--ds-space-3);
  font-size: var(--ds-font-s);
  font-weight: var(--ds-weight-strong);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}
.tiles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ds-space-3);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
.tile {
  display: grid;
  gap: var(--ds-space-3);
  align-content: start;
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-l);
  background: var(--ds-surface-card);
}
.tile-title {
  margin: 0;
  font-size: var(--ds-font-l);
}
.summary {
  margin: 0;
  color: var(--ds-text-muted);
  line-height: 1.5;
}
.badge {
  justify-self: start;
}
.scenarios {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
}
.scenarios-label {
  font-size: var(--ds-font-s);
  font-weight: var(--ds-weight-strong);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ds-text-muted);
}
</style>
