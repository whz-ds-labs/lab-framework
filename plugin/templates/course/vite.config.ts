import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

// VITE_BASE is "/<repository name>/" on GitHub Pages and unset (= "/") for local use.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vue()],
  resolve: { dedupe: ['vue'] },
  worker: { format: 'es' },
  test: {
    environment: 'happy-dom',
    include: ['labs/*/tests/unit/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 120_000,
  },
})
