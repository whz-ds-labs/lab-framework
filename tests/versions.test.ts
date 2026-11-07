import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { readVersions } from '../scripts/sync-plugin-version.mjs'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const script = join(repo, 'scripts', 'sync-plugin-version.mjs')
const tmps: string[] = []

function copyOfRepoManifests(): string {
  const root = mkdtempSync(join(tmpdir(), 'versions '))
  tmps.push(root)
  for (const f of [
    'plugin/package.json',
    'plugin/.claude-plugin/plugin.json',
    '.claude-plugin/marketplace.json',
    'packages/lab-kit/package.json',
    'packages/ui/package.json',
  ]) {
    mkdirSync(dirname(join(root, f)), { recursive: true })
    cpSync(join(repo, f), join(root, f))
  }
  return root
}

function editJson(file: string, fn: (j: any) => void): void {
  const j = JSON.parse(readFileSync(file, 'utf8'))
  fn(j)
  writeFileSync(file, JSON.stringify(j, null, 2) + '\n')
}

function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [script, ...args, '--root', root], { encoding: 'utf8' })
}

afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('readVersions', () => {
  it('reads all six version fields from the repo', () => {
    const v = readVersions(repo)
    expect(Object.keys(v).sort()).toEqual(['labKit', 'marketplace', 'plugin', 'pluginJson', 'ui', 'uiDepOnLabKit'])
    for (const value of Object.values(v)) expect(typeof value).toBe('string')
  })
})

describe('sync-plugin-version --check', () => {
  it('exits 0 for the real repo', () => {
    const r = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8', cwd: repo })
    expect(r.status, r.stdout + r.stderr).toBe(0)
  })

  it('exits 1 when plugin.json differs', () => {
    const root = copyOfRepoManifests()
    editJson(join(root, 'plugin/.claude-plugin/plugin.json'), (j) => (j.version = '9.9.9'))
    const r = run(root, '--check')
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('pluginJson')
  })

  it('exits 1 when ui depends on another lab-kit version', () => {
    const root = copyOfRepoManifests()
    editJson(join(root, 'packages/ui/package.json'), (j) => (j.dependencies['@whz-ds-labs/lab-kit'] = '1.2.3'))
    const r = run(root, '--check')
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('uiDepOnLabKit')
  })

  it('sync mode copies the plugin version into both manifests', () => {
    const root = copyOfRepoManifests()
    editJson(join(root, 'plugin/package.json'), (j) => (j.version = '3.4.5'))
    const r = run(root)
    expect(r.status, r.stderr).toBe(0)
    expect(readVersions(root).pluginJson).toBe('3.4.5')
    expect(readVersions(root).marketplace).toBe('3.4.5')
  })
})
