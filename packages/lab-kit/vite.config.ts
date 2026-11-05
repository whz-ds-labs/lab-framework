import { defineConfig } from 'vite'

const exclude = ['plugin/templates/**', 'examples/**', '**/dist/**', '**/node_modules/**']

export default defineConfig({
  build: {
    lib: {
      // Later tasks add: testing/index, testing/e2e, stylelint/index, stylelint/config.
      entry: { index: 'src/index.ts', worker: 'src/worker.ts' },
      formats: ['es'],
    },
    // Vite 8 (Rolldown): `rolldownOptions` is current, `rollupOptions` is the deprecated alias.
    rolldownOptions: {
      external: ['vue', /^node:/, 'stylelint', 'postcss', 'postcss-html', '@playwright/test', '@axe-core/playwright'],
      // Shared chunks are allowed, so modules like i18n/state exist once across entries.
      output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js' },
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    name: 'lab-kit',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    exclude,
  },
})
