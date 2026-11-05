import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { describe, expect, it } from 'vitest'
import { distAvailable, packageRoot as root } from './helpers/dist'

// Throws under CI when dist/ is missing; skips locally.
const built = distAvailable()

function targets(node: unknown): string[] {
  if (typeof node === 'string') return [node]
  if (node && typeof node === 'object') return Object.values(node).flatMap(targets)
  return []
}

describe.skipIf(!built)('package exports', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { exports: Record<string, unknown> }
  const files = [...new Set(targets(pkg.exports))].map((t) => normalize(t).replace(/^\.[\\/]/, '').replaceAll('\\', '/'))

  it('lists at least the root entry', () => {
    expect(files).toContain('dist/index.js')
    expect(files).toContain('dist/index.d.ts')
  })

  it('has every export target on disk', () => {
    for (const f of files) expect(existsSync(join(root, f)), f).toBe(true)
  })

  it('packs every export target into the tarball', () => {
    // shell:true so that npm.cmd resolves on Windows; no user input is involved.
    const out = execFileSync('npm pack --dry-run --json', { cwd: root, encoding: 'utf8', shell: true })
    // Run inside a workspace, npm 11 keys the result by package name instead of returning an array.
    type Pack = { files: { path: string }[] }
    const parsed = JSON.parse(out) as Pack[] | Record<string, Pack>
    const first = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0]
    const packed = new Set(first!.files.map((f) => f.path))
    for (const f of files) expect(packed.has(f), f).toBe(true)
  }, 60_000)
})
