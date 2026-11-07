<script setup lang="ts">
import { computed } from 'vue'
import { useI18n, verifyAttrs, type VerifyState } from '@whz-ds-labs/lab-kit'

const props = defineProps<{
  state: VerifyState
  /** Error text (state `error`). */
  message?: string
  /** Optional progress while `loading`. */
  progress?: { done: number; total: number }
}>()
const { t } = useI18n()

const attrs = computed(() => verifyAttrs('status', props.state, { count: props.progress?.done, error: props.message }))
</script>

<template>
  <section class="status-panel" v-bind="attrs">
    <div v-if="state === 'loading'" class="msg" role="status">
      <p>{{ t('kit.status.loading') }}</p>
      <template v-if="progress">
        <progress :value="progress.done" :max="progress.total" />
        <span class="count">{{ t('kit.status.progress', { done: progress.done, total: progress.total }) }}</span>
      </template>
    </div>
    <p v-else-if="state === 'empty'" class="msg">{{ t('kit.status.empty') }}</p>
    <div v-else-if="state === 'error'" class="error-box" role="alert">
      <strong>{{ t('kit.status.error') }}</strong>
      <span v-if="message"> {{ message }}</span>
    </div>
    <slot v-else />
  </section>
</template>

<style scoped>
.msg {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2) var(--ds-space-3);
  color: var(--ds-text-muted);
  margin: var(--ds-space-2) 0;
}
.msg p {
  margin: 0;
}
progress {
  accent-color: var(--ds-accent);
}
.count {
  font-variant-numeric: tabular-nums;
}
/* Error: tinted surface and a strong label instead of a coloured edge line. */
.error-box {
  background: var(--ds-error-bg);
  color: var(--ds-text);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-m);
}
.error-box strong {
  color: var(--ds-error);
}
</style>
