import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import { distAvailable, packageRoot } from './helpers/dist'

// Throws under CI when dist/ is missing; skips locally with a warning.
const built = distAvailable()

/** Imports a built entry in a plain Node child process: no happy-dom globals, so a DOM access at import fails. */
function importInNode(file: string) {
  const url = pathToFileURL(join(packageRoot, file)).href
  return spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(url)})`], {
    encoding: 'utf8',
  })
}

describe.skipIf(!built)('entries import in plain Node (no DOM)', () => {
  it('dist/worker.js', () => {
    const r = importInNode('dist/worker.js')
    expect(r.stderr).toBe('')
    expect(r.status).toBe(0)
  })
})
