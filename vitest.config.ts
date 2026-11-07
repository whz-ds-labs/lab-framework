import { defineConfig } from 'vitest/config'

const exclude = ['plugin/templates/**', 'examples/**', '**/dist/**', '**/node_modules/**']

export default defineConfig({
  test: {
    exclude,
    projects: [
      'packages/*/vite.config.ts',
      { test: { name: 'plugin', environment: 'node', include: ['plugin/test/**/*.test.ts'], exclude } },
      { test: { name: 'repo', environment: 'node', include: ['tests/**/*.test.ts'], exclude } },
    ],
  },
})
