<script setup lang="ts">
import { computed } from 'vue'
import { dismissNotice, useI18n, useNotices } from '@whz-ds-labs/lab-kit'

/**
 * Corrections made while reading the address: `problems` are parameter names (one line each, `kit.url.problem`).
 * The global notices of lab-kit (`useNotices()`, full message keys) are shown below and can be dismissed.
 */
defineProps<{ problems: string[] }>()
const { t } = useI18n()
const notices = useNotices()
const noticeCount = computed(() => notices.value.length)
</script>

<template>
  <section
    class="url-notice"
    data-verify-unit="url-notice"
    :data-verify-state="problems.length + noticeCount === 0 ? 'empty' : 'ready'"
    :data-verify-count="problems.length + noticeCount"
  >
    <div v-if="problems.length > 0" class="box" role="status">
      <strong>{{ t('kit.url.noticeTitle') }}</strong>
      <p class="intro">{{ t('kit.url.noticeIntro') }}</p>
      <ul>
        <li v-for="p in problems" :key="p">{{ t('kit.url.problem', { param: p }) }}</li>
      </ul>
    </div>
    <div v-for="n in notices" :key="n.id" class="box notice" role="status">
      <span class="text">{{ t(n.key, n.vars) }}</span>
      <button type="button" class="ds-btn small" :aria-label="t('kit.notice.dismiss')" @click="dismissNotice(n.id)">
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Notices are cards on the page surface: separated by surface level, spacing and radius only. */
.box {
  background: var(--ds-surface-card);
  color: var(--ds-text);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-m);
  margin: var(--ds-space-2) 0;
}
.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
}
.intro {
  margin: var(--ds-space-1) 0;
}
ul {
  margin: var(--ds-space-1) 0 0;
  padding-left: var(--ds-space-5);
}
</style>
