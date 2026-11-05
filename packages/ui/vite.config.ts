import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const exclude = ['plugin/templates/**', 'examples/**', '**/dist/**', '**/node_modules/**']

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: { index: 'src/index.ts' },
      formats: ['es'],
      // base.css is imported by src/index.ts and ends up as dist/style.css.
      cssFileName: 'style',
    },
    // Vite 8 (Rolldown): `rolldownOptions` is current, `rollupOptions` is the deprecated alias.
    rolldownOptions: {
      external: ['vue', '@whz-ds-labs/lab-kit', /^@whz-ds-labs\/lab-kit\//, 'katex', /^katex\//, 'd3-scale'],
      output: { entryFileNames: '[name].js', chunkFileNames: 'chunks/[name]-[hash].js' },
    },
    sourcemap: true,
    minify: false,
  },
  test: {
    name: 'ui',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
    exclude,
  },
})
