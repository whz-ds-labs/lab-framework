<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  buildHash,
  localized,
  notify,
  resolveRoute,
  toggleLang,
  useI18n,
  useRoute,
  type CourseDefinition,
} from '@whz-ds-labs/lab-kit'
import HelpDrawer from '../HelpDrawer.vue'
import UrlNotice from '../UrlNotice.vue'
import { useNarrowViewport } from '../viewport'
import CourseHome from './CourseHome.vue'
import LabHome from './LabHome.vue'
import ToolHost from './ToolHost.vue'

/**
 * Page frame of a course: header (course/lab title, tool pills of the current lab, help and language buttons),
 * the view of the current route and the help drawer. Below 768 px the open drawer is modal: header and page are
 * inert and the body does not scroll; from 768 px it is a 360 px side panel and the page moves left of it.
 */
const props = defineProps<{ course: CourseDefinition }>()

const { lang, t } = useI18n()
const parsed = useRoute()
const resolved = computed(() => resolveRoute(props.course, parsed.value))
const current = computed(() => resolved.value.route)
const lab = computed(() => (current.value.kind === 'course' ? null : current.value.lab))
const tool = computed(() => (current.value.kind === 'tool' ? current.value.tool : null))
const routeName = computed(() => (lab.value ? (tool.value ? `${lab.value.id}/${tool.value.id}` : lab.value.id) : ''))

// ---- help drawer ------------------------------------------------------------------------------------------------
const narrow = useNarrowViewport()
const helpOpen = ref(false)
const helpActive = computed(() => helpOpen.value && tool.value !== null)
const modal = computed(() => helpActive.value && narrow.value)
const pushed = computed(() => helpActive.value && !narrow.value)

const helpBtn = ref<HTMLButtonElement | null>(null)
const headEl = ref<HTMLElement | null>(null)
/** Bottom edge of the header in the viewport: the drawer starts there and moves up as the header scrolls away. */
const helpTop = ref(0)

function updateHelpTop(): void {
  helpTop.value = Math.max(0, Math.round(headEl.value?.getBoundingClientRect().bottom ?? 0))
}

async function closeHelp(): Promise<void> {
  helpOpen.value = false
  // After the re-render the page is no longer inert, so the button can take the focus back.
  await nextTick()
  helpBtn.value?.focus()
}

function toggleHelp(): void {
  if (helpOpen.value) void closeHelp()
  else helpOpen.value = true
}

// Only tool routes have help.
watch(tool, (tl) => {
  if (tl === null) helpOpen.value = false
})

watch(
  modal,
  (m) => {
    if (typeof document !== 'undefined') document.body.style.overflow = m ? 'hidden' : ''
  },
  { immediate: true },
)

let headObserver: ResizeObserver | null = null
onMounted(() => {
  updateHelpTop()
  window.addEventListener('scroll', updateHelpTop, { passive: true })
  window.addEventListener('resize', updateHelpTop)
  if (typeof ResizeObserver !== 'undefined' && headEl.value) {
    headObserver = new ResizeObserver(updateHelpTop)
    headObserver.observe(headEl.value)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateHelpTop)
  window.removeEventListener('resize', updateHelpTop)
  headObserver?.disconnect()
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

// An address that names no lab or tool falls back to the nearest page and tells the user (once per address).
watch(
  resolved,
  (r) => {
    if (r.unknownRoute) notify('kit.notice.invalidUrl')
  },
  { immediate: true },
)

// Screen readers and hyphenation follow the UI language.
watch(
  lang,
  (l) => {
    document.documentElement.lang = l
  },
  { immediate: true },
)
</script>

<template>
  <div
    class="shell"
    data-verify-unit="lab-shell"
    data-verify-state="ready"
    :data-verify-route="routeName"
    :style="{ '--help-top': `${helpTop}px` }"
  >
    <header ref="headEl" class="head" :inert="modal">
      <div class="titles">
        <h1>
          <a class="brand" :href="buildHash({})">{{ localized(course.title) }}</a>
        </h1>
        <a v-if="lab" class="lab-link" :href="buildHash({ lab: lab.id })">{{ localized(lab.title) }}</a>
      </div>
      <nav v-if="lab" class="tools" :aria-label="t('kit.nav.label')">
        <a
          v-for="tl in lab.tools"
          :key="tl.id"
          class="ds-pill"
          :href="buildHash({ lab: lab.id, tool: tl.id })"
          :aria-current="tool && tool.id === tl.id ? 'page' : undefined"
          >{{ localized(tl.title) }}</a
        >
      </nav>
      <div class="actions">
        <button
          v-if="tool"
          ref="helpBtn"
          type="button"
          class="ds-btn"
          data-action="help"
          aria-controls="help-drawer"
          :aria-expanded="helpOpen ? 'true' : 'false'"
          @click="toggleHelp"
        >
          <span aria-hidden="true">? </span>{{ t('kit.help.button') }}
        </button>
        <button
          type="button"
          class="ds-btn"
          data-verify-unit="lang-toggle"
          :aria-label="t('kit.lang.toggle')"
          @click="toggleLang"
        >
          {{ lang === 'de' ? 'EN' : 'DE' }}
        </button>
      </div>
    </header>

    <main class="page" :class="{ 'help-pushed': pushed }" :inert="modal">
      <UrlNotice v-if="!tool" :problems="[]" />
      <ToolHost v-if="lab && tool" :key="`${lab.id}/${tool.id}`" :lab="lab" :tool="tool" />
      <LabHome v-else-if="lab" :lab="lab" />
      <CourseHome v-else :course="course" />
    </main>

    <HelpDrawer :lab-id="lab?.id ?? ''" :tool="tool" :open="helpActive" @close="closeHelp" />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  background: var(--ds-surface-page);
  color: var(--ds-text);
}
/* The header is a card-level surface above the page; surface step and spacing set it off, no line. */
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-3) var(--ds-space-5);
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-surface-card);
}
.titles {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--ds-space-1) var(--ds-space-3);
}
h1 {
  margin: 0;
  font-size: var(--ds-font-l);
  font-weight: var(--ds-weight-strong);
}
.brand {
  color: var(--ds-text);
  text-decoration: none;
}
.lab-link {
  color: var(--ds-text-muted);
}
.tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  flex: 1;
  min-width: 0;
}
.actions {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin-inline-start: auto;
}
.actions .ds-btn[aria-expanded='true'] {
  background: var(--ds-accent);
  color: var(--ds-accent-contrast);
  font-weight: var(--ds-weight-strong);
}
.page {
  max-width: 1320px;
  margin: 0 auto;
  padding: var(--ds-space-4);
  display: grid;
  gap: var(--ds-space-4);
}
/* Help open on a wide screen: the page moves left of the 360 px drawer instead of lying under it. */
.page.help-pushed {
  margin: 0;
  max-width: none;
  padding-right: calc(360px + var(--ds-space-4));
}
@media (max-width: 640px) {
  .tools {
    order: 3;
    flex-basis: 100%;
  }
}
</style>
