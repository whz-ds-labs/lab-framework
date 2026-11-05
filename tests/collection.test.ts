import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

describe('root test collection', () => {
  it('never collects template or example files', () => {
    const r = spawnSync('npx vitest list --filesOnly --json', {
      cwd: root, encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024,
    })
    expect(r.status, r.stderr).toBe(0)
    const start = r.stdout.indexOf('[')
    const files = (JSON.parse(r.stdout.slice(start)) as { file: string }[]).map((e) => e.file.replaceAll('\\', '/'))
    expect(files.length).toBeGreaterThan(0)
    expect(files.filter((f) => f.includes('plugin/templates') || f.includes('examples/'))).toEqual([])
  }, 120_000)
})
