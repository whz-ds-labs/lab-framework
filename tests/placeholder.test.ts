import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const script = join(repo, 'scripts', 'placeholder.mjs')
const tmps: string[] = []

afterAll(() => {
  for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true })
})

describe('placeholder.mjs', () => {
  const out = mkdtempSync(join(tmpdir(), 'placeholder '))
  tmps.push(out)
  const res = spawnSync(process.execPath, [script, out], { encoding: 'utf8' })

  it('exits 0 and prints PowerShell-safe commands', () => {
    expect(res.status).toBe(0)
    expect(res.stdout).toContain('npm publish')
    expect(res.stdout).not.toContain('&&')
  })

  for (const [dir, name] of [
    ['lab-kit', '@whz-ds-labs/lab-kit'],
    ['ui', '@whz-ds-labs/ui'],
  ] as const) {
    it(`writes ${dir} with package.json and README.md`, () => {
      expect(existsSync(join(out, dir, 'README.md'))).toBe(true)
      const pkg = JSON.parse(readFileSync(join(out, dir, 'package.json'), 'utf8'))
      expect(pkg.name).toBe(name)
      expect(pkg.version).toBe('0.0.0')
      expect(pkg.description).toBe('Placeholder – real releases are published from CI (whz-ds-labs/lab-framework)')
      expect(pkg.license).toBe('MIT')
      expect(pkg.repository).toEqual({
        type: 'git',
        url: 'git+https://github.com/whz-ds-labs/lab-framework.git',
        directory: `packages/${dir}`,
      })
    })
  }

  it('fails without an output dir', () => {
    expect(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status).toBe(1)
  })
})
