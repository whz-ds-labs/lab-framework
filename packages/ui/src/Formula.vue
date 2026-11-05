<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
// The KaTeX stylesheet is not imported here: course apps import "katex/dist/katex.min.css" themselves.

// KaTeX output is generated from the TeX source; `trust` stays off (default), so v-html in the template is safe.
// (The comment lives here, not in the template: a template comment would make the root a fragment in dev builds.)
const props = withDefaults(defineProps<{ tex: string; display?: boolean }>(), { display: false })
const html = computed(() =>
  katex.renderToString(props.tex, { displayMode: props.display, throwOnError: false, output: 'htmlAndMathml' }),
)
</script>

<template>
  <span class="formula" :class="{ display }" v-html="html" />
</template>

<style scoped>
.formula.display {
  display: block;
  overflow-x: auto;
}
</style>
