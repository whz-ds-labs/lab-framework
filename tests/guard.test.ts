import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { findForbidden } from '../scripts/check-no-materials.mjs'

describe('findForbidden', () => {
  it('flags notebooks, pdfs and materials directories', () => {
    expect(findForbidden(['a/b.ipynb', 'x/Slides.PDF', 'materials/x.csv', 'labs/a/materials/y.txt'])).toHaveLength(4)
  })
  it('allows the single template materials README', () => {
    expect(findForbidden(['plugin/templates/course-intern/materials/README.md'])).toEqual([])
  })
  it('flags docs/superpowers and env files', () => {
    expect(findForbidden(['docs/superpowers/plans/p.md', '.env', 'packages/ui/.env.local'])).toHaveLength(3)
  })
  it('does not flag lookalikes', () => {
    expect(findForbidden(['src/materialsHelper.ts', 'README.md', '.env.example'])).toEqual([])
  })
})

describe('guard CLI with non-ASCII file names', () => {
  it('fails on a tracked umlaut pdf (git must not quote the path)', () => {
    const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'check-no-materials.mjs')
    const repo = mkdtempSync(join(tmpdir(), 'guard umlaut '))
    try {
      const git = (...args: string[]) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
      git('init', '-q')
      writeFileSync(join(repo, 'Folieä.pdf'), 'x')
      git('add', '-A')
      const r = spawnSync(process.execPath, [script], { cwd: repo, encoding: 'utf8' })
      expect(r.status).toBe(1)
      expect(r.stderr).toContain('Folieä.pdf')
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })
})
