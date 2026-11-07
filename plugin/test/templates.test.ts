import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { scaffold } from '../scripts/scaffold.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const pluginPkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as { version: string }
const rootPkg = JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8')) as {
  devDependencies: Record<string, string>
}
let tmp: string

const read = (dir: string, rel: string) => readFileSync(join(dir, rel), 'utf8')

function listAll(dir: string, rel = ''): string[] {
  return readdirSync(join(dir, rel), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listAll(dir, rel ? `${rel}/${e.name}` : e.name) : [rel ? `${rel}/${e.name}` : e.name],
  )
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'real templates '))
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

describe('real course template', () => {
  const make = () => {
    const dir = join(tmp, 'course')
    scaffold('course', { dir, course: 'demo-kurs', titleDe: 'Demo Kurs', titleEn: 'Demo course' })
    return dir
  }

  it('produces a package.json with exact framework versions and exact pins', () => {
    const dir = make()
    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.name).toBe('demo-kurs')
    expect(pkg.private).toBe(true)
    expect(pkg.engines.node).toBe('>=24.15')
    expect(pkg.dependencies['@whz-ds-labs/ui']).toBe(pluginPkg.version)
    expect(pkg.dependencies['@whz-ds-labs/lab-kit']).toBe(pluginPkg.version)
    const all = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>
    for (const [name, range] of Object.entries(all)) {
      if (name === 'typescript') continue
      expect(range, name).toMatch(/^\d+\.\d+\.\d+$/)
    }
    for (const [name, range] of Object.entries(pkg.devDependencies as Record<string, string>)) {
      expect(range, name).toBe(rootPkg.devDependencies[name])
    }
    for (const name of ['vue', 'katex', 'd3-scale']) expect(all[name], name).toBe(rootPkg.devDependencies[name])
    for (const script of ['dev', 'build', 'preview', 'test', 'test:py', 'golden', 'test:e2e', 'lint:css', 'guard', 'changed-labs']) {
      expect(pkg.scripts[script], script).toBeTruthy()
    }
  })

  it('keeps both lab markers and wires the course definition', () => {
    const dir = make()
    const course = read(dir, 'site/course.ts')
    expect(course).toContain('// ds-labs:lab-imports')
    expect(course).toContain('// ds-labs:lab-list')
    expect(course).toContain("id: 'demo-kurs'")
    expect(course).toContain("de: 'Demo Kurs'")
  })

  it('has workflows whose Actions expressions survive', () => {
    const dir = make()
    for (const f of ['ci.yml', 'pages.yml']) {
      const text = read(dir, `.github/workflows/${f}`)
      expect(text).toContain('on:')
      expect(text).toContain('jobs:')
    }
    expect(read(dir, '.github/workflows/ci.yml')).toContain('${{ github.event.repository.name }}')
    expect(read(dir, '.github/workflows/ci.yml')).toContain('${{ runner.os }}')
    expect(read(dir, '.github/workflows/pages.yml')).toContain('${{ github.event.repository.name }}')
    expect(read(dir, 'renovate.json')).toContain('"rangeStrategy": "pin"')
  })

  it('deploys Pages only after a successful CI run, not on every push', () => {
    const dir = make()
    const pages = read(dir, '.github/workflows/pages.yml')
    expect(read(dir, '.github/workflows/ci.yml')).toMatch(/^name: CI$/m)
    expect(pages).toMatch(/workflow_run:\s+workflows: \[CI\]\s+types: \[completed\]\s+branches: \[main\]/)
    expect(pages).toContain('workflow_dispatch:')
    expect(pages).not.toMatch(/^\s*push:/m)
    expect(pages).toContain("github.event.workflow_run.conclusion == 'success'")
    expect(pages).toContain('${{ github.event.workflow_run.head_sha || github.sha }}')
  })

  it('renames underscore files and leaves no placeholder behind', () => {
    const dir = make()
    for (const f of ['CLAUDE.md', '.gitignore', '.gitattributes', 'LICENSE', 'README.md', 'scripts/check-no-materials.mjs']) {
      expect(existsSync(join(dir, f)), f).toBe(true)
    }
    expect(existsSync(join(dir, '_CLAUDE.md'))).toBe(false)
    expect(read(dir, 'CLAUDE.md')).toContain('demo-kurs-intern')
    expect(read(dir, 'LICENSE')).toContain(String(new Date().getFullYear()))
    for (const f of listAll(dir)) expect(read(dir, f), f).not.toMatch(/%%[A-Za-z]+%%/)
  })

  it('guard script reads git ls-files with NUL separators', () => {
    const dir = make()
    const guard = read(dir, 'scripts/check-no-materials.mjs')
    expect(guard).toContain("'-z'")
    expect(guard).toContain(".split('\\0')")
  })
})

describe('real intern template', () => {
  it('contains the materials README and the docs README', () => {
    const dir = join(tmp, 'intern')
    scaffold('intern', { dir, course: 'demo-kurs' })
    expect(existsSync(join(dir, 'materials/README.md'))).toBe(true)
    expect(existsSync(join(dir, 'docs/README.md'))).toBe(true)
    expect(existsSync(join(dir, '.gitignore'))).toBe(true)
    expect(read(dir, 'README.md')).toContain('demo-kurs-intern')
  })
})
