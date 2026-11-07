import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findForbidden } from '../scripts/check-no-materials.mjs'
import { changedLabs } from '../scripts/changed-labs.mjs'

describe('findForbidden', () => {
  it('flags notebooks, pdfs and materials directories', () => {
    expect(findForbidden(['a/b.ipynb', 'x/Slides.PDF', 'materials/x.csv', 'labs/a/materials/y.txt'])).toHaveLength(4)
  })
  it('flags docs/superpowers and env files', () => {
    expect(findForbidden(['docs/superpowers/plans/p.md', '.env', 'labs/a/.env.local'])).toHaveLength(3)
  })
  it('does not flag lookalikes', () => {
    expect(findForbidden(['src/materialsHelper.ts', 'README.md', '.env.example'])).toEqual([])
  })
  it('fails the CLI on a tracked umlaut pdf', () => {
    const repo = mkdtempSync(join(tmpdir(), 'guard umlaut '))
    try {
      const git = (...args: string[]) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' })
      git('init', '-q')
      writeFileSync(join(repo, 'Folieä.pdf'), 'x')
      git('add', '-A')
      const r = spawnSync(process.execPath, [resolve('scripts/check-no-materials.mjs')], { cwd: repo, encoding: 'utf8' })
      expect(r.status).toBe(1)
      expect(r.stderr).toContain('Folieä.pdf')
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })
})

describe('changedLabs', () => {
  const labs = ['a', 'b', 'c']
  it('returns only the touched labs when everything changed inside labs/', () => {
    expect(changedLabs(['labs/b/lab.ts', 'labs/a/x/y.ts'], labs)).toEqual(['labs/a', 'labs/b'])
  })
  it('returns all labs when anything outside labs/ changed', () => {
    expect(changedLabs(['labs/b/lab.ts', 'package.json'], labs)).toEqual(['labs/a', 'labs/b', 'labs/c'])
  })
  it('returns nothing for no changes', () => {
    expect(changedLabs([], labs)).toEqual([])
  })
})
