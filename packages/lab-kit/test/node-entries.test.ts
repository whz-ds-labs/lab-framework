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

  it('dist/testing/index.js', () => {
    const r = importInNode('dist/testing/index.js')
    expect(r.stderr).toBe('')
    expect(r.status).toBe(0)
  })

  it('dist/stylelint/index.js', () => {
    const r = importInNode('dist/stylelint/index.js')
    expect(r.stderr).toBe('')
    expect(r.status).toBe(0)
  })

  it('dist/stylelint/config.js points at the built plugin entry', () => {
    const url = pathToFileURL(join(packageRoot, 'dist/stylelint/config.js')).href
    const r = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', `const { default: c } = await import(${JSON.stringify(url)}); console.log(JSON.stringify(c))`],
      { encoding: 'utf8' },
    )
    expect(r.stderr).toBe('')
    expect(r.status).toBe(0)
    const config = JSON.parse(r.stdout) as { plugins: string[]; rules: Record<string, unknown> }
    expect(config.plugins).toEqual([join(packageRoot, 'dist/stylelint/index.js')])
    expect(Object.keys(config.rules)).toEqual(['ds-labs/no-separator-lines', 'ds-labs/color-tokens-only'])
  })
})
