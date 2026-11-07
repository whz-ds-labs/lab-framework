<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@whz-ds-labs/lab-kit'

const props = defineProps<{ chapter: string; code?: string }>()
const { t } = useI18n()

/**
 * The badge text as segments: the catalogue template (e.g. "Lehrbuch Kap. {chapter} · Notebook Zelle {code}") with
 * the chapter and code values as separate parts, so ranges like "87–94" can be kept on one line (nowrap).
 */
const parts = computed(() => {
  const template = props.code ? t('kit.ref.badge') : t('kit.ref.badgeNoCode')
  const values: Record<string, string> = { chapter: props.chapter, code: props.code ?? '' }
  return template
    .split(/(\{chapter\}|\{code\})/)
    .filter((s) => s !== '')
    .map((s) => {
      const name = s.slice(1, -1)
      return s.startsWith('{') && name in values ? { text: values[name]!, value: true } : { text: s, value: false }
    })
})
</script>

<template>
  <span class="ref-badge"
    ><template v-for="(p, i) in parts" :key="i"
      ><span v-if="p.value" class="nowrap">{{ p.text }}</span
      ><template v-else>{{ p.text }}</template></template
    ></span
  >
</template>

<style scoped>
/* A small pill on the area surface; no outline. */
.ref-badge {
  display: inline-block;
  padding: var(--ds-space-1) var(--ds-space-3);
  border-radius: var(--ds-radius-pill);
  background: var(--ds-surface-area);
  color: var(--ds-text-muted);
  font-size: var(--ds-font-s);
  letter-spacing: 0.02em;
}
/* Chapter and code ranges such as "87–94" never break at the dash. */
.nowrap {
  white-space: nowrap;
}
</style>
