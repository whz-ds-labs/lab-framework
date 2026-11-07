import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Package root (`packages/lab-kit`). */
export const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Whether `dist/index.js` has been built. Locally a missing build returns false (callers skip with a warning).
 * Under CI (`process.env.CI` set) a missing build throws, so a pipeline that runs vitest without building
 * fails instead of reporting green.
 */
export function distAvailable(): boolean {
  if (existsSync(join(packageRoot, 'dist', 'index.js'))) return true
  const message = 'lab-kit dist/ is missing - run "npm run build -w packages/lab-kit" first.'
  if (process.env.CI) throw new Error(`${message} (CI is set, so dist-dependent tests must not be skipped)`)
  console.warn(`dist-dependent tests skipped: ${message}`)
  return false
}
