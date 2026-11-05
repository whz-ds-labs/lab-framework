import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pluginDir = join(repo, 'plugin')

const SKILLS = ['lab-start', 'lab-analyze', 'lab-build', 'lab-design', 'lab-release']
const AGENTS = ['lab-plan-reviewer', 'lab-verifier', 'lab-design-reviewer']

function walk(dir: string): string[] {
  const out: string[] = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules') continue
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

const TEXT = /\.(md|ts|vue|js|mjs|json|py|toml|yml|yaml|css|html|txt|lock)$|(^|[\/])_[^\/]+$|LICENSE$/

describe('skills and agents', () => {
  it('the five skills exist', () => {
    for (const s of SKILLS) expect(existsSync(join(pluginDir, 'skills', s, 'SKILL.md')), s).toBe(true)
  })

  it('the three agents exist', () => {
    for (const a of AGENTS) expect(existsSync(join(pluginDir, 'agents', `${a}.md`)), a).toBe(true)
  })

  it('skill name matches its folder and agent name matches its file', () => {
    for (const s of SKILLS) {
      const text = readFileSync(join(pluginDir, 'skills', s, 'SKILL.md'), 'utf8')
      expect(text, s).toMatch(new RegExp(`^---\r?\nname: ${s}\r?\n`))
    }
    for (const a of AGENTS) {
      const text = readFileSync(join(pluginDir, 'agents', `${a}.md`), 'utf8')
      expect(text, a).toMatch(new RegExp(`^---\r?\nname: ${a}\r?\n`))
    }
  })

  it('no file under plugin/ contains private paths, addresses or names', () => {
    const forbidden = ['C:\Users', '/Users/', '@gmail.com', 'AlexFractalNode', 'Claude Wiki']
    // plugin/test is skipped: these tests name the forbidden strings themselves.
    const testDir = join(pluginDir, 'test')
    for (const f of walk(pluginDir).filter((p) => !p.startsWith(testDir) && TEXT.test(p) && statSync(p).isFile())) {
      const text = readFileSync(f, 'utf8')
      for (const needle of forbidden) expect(text.includes(needle), `${f} contains ${needle}`).toBe(false)
    }
  })

  it('every scaffold.mjs invocation in skills uses the quoted plugin-root path', () => {
    let found = 0
    for (const s of SKILLS) {
      const text = readFileSync(join(pluginDir, 'skills', s, 'SKILL.md'), 'utf8')
      for (const line of text.split(/\r?\n/).filter((l) => l.includes('scaffold.mjs'))) {
        if (!/\bnode\b/.test(line)) continue
        found++
        expect(line, `${s}: ${line}`).toContain('node "${CLAUDE_PLUGIN_ROOT}/scripts/scaffold.mjs"')
      }
    }
    expect(found).toBeGreaterThanOrEqual(3)
  })

  it('lab-start covers all three scaffold commands and prerequisites', () => {
    const text = readFileSync(join(pluginDir, 'skills', 'lab-start', 'SKILL.md'), 'utf8')
    for (const needle of ['scaffold.mjs" course', 'scaffold.mjs" intern', 'scaffold.mjs" lab', 'gh auth status', 'node -v', 'uv --version', '--packs']) {
      expect(text, needle).toContain(needle)
    }
  })

  it('inventory.py reports "no materials found" on an empty directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ds-labs-inventory-'))
    try {
      const script = join(pluginDir, 'skills', 'lab-analyze', 'scripts', 'inventory.py')
      expect(existsSync(script)).toBe(true)
      const r = spawnSync(
        'uv',
        ['run', '--native-tls', '--with', 'nbformat', '--with', 'pypdf', 'python', script, dir],
        { encoding: 'utf8' },
      )
      expect(r.error, String(r.error)).toBeUndefined()
      expect(r.status, r.stderr).toBe(0)
      expect(r.stdout).toContain('no materials found')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }, 120_000)
})
