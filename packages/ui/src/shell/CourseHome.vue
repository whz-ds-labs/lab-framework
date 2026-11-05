<script setup lang="ts">
import { computed } from 'vue'
import { buildHash, localized, useI18n, verifyAttrs, type CourseDefinition } from '@whz-ds-labs/lab-kit'

/** Start page of a course: title, lead, one tile per lab and the roadmap of what is still to come. */
const props = defineProps<{ course: CourseDefinition }>()
const { t } = useI18n()
const roadmapAttrs = computed(() =>
  verifyAttrs('roadmap', props.course.roadmap.length ? 'ready' : 'empty', { count: props.course.roadmap.length }),
)
</script>

<template>
  <div class="home" v-bind="verifyAttrs('course-home', 'ready', { count: course.labs.length })">
    <header class="head">
      <h2 class="title">{{ localized(course.title) }}</h2>
      <p class="lead">{{ localized(course.lead) }}</p>
    </header>

    <section aria-labelledby="home-labs-title">
      <h3 id="home-labs-title" class="label">{{ t('kit.home.labsTitle') }}</h3>
      <ul class="tiles">
        <li v-for="lab in course.labs" :key="lab.id" class="tile" :data-lab-tile="lab.id">
          <h4 class="tile-title">
            <a :href="buildHash({ lab: lab.id })">{{ localized(lab.title) }}</a>
          </h4>
          <p class="summary">{{ localized(lab.summary) }}</p>
        </li>
      </ul>
    </section>

    <section v-if="course.roadmap.length > 0" aria-labelledby="home-roadmap-title">
      <h3 id="home-roadmap-title" class="label">{{ t('kit.home.roadmapTitle') }}</h3>
      <ol class="roadmap" v-bind="roadmapAttrs">
        <li v-for="(item, i) in course.roadmap" :key="i" class="item">
          <span class="name">{{ localized(item.title) }}</span>
          <span v-if="item.note" class="note">{{ localized(item.note) }}</span>
        </li>
      </ol>
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
.tiles,
.roadmap {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ds-space-3);
}
.tiles {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
}
.tile {
  display: grid;
  gap: var(--ds-space-2);
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
.item {
  display: grid;
  gap: var(--ds-space-1);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-m);
  background: var(--ds-surface-area);
}
.name {
  font-weight: var(--ds-weight-strong);
}
.note {
  color: var(--ds-text-muted);
  font-size: var(--ds-font-s);
}
</style>
