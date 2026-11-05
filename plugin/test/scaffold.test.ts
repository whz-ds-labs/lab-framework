import { spawnSync } from 'node:child_process'
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { scaffold } from '../scripts/scaffold.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const fxSource = join(here, 'fixtures', 'templates')
const cli = join(here, '..', 'scripts', 'scaffold.mjs')
let tmp: string
let fx: string

const read = (dir: string, rel: string) => readFileSync(join(dir, rel), 'utf8')

function grepAll(dir: string, re: RegExp): string[] {
  const hits: string[] = []
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (re.test(readFileSync(p, 'utf8'))) hits.push(p)
    }
  }
  walk(dir)
  return hits
}

const courseOpts = (dir: string) => ({
  dir, course: 'demo-kurs', titleDe: 'Demo', titleEn: 'Demo', templatesDir: fx,
})

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'scaffold test '))
  fx = join(tmp, 'templates')
  cpSync(fxSource, fx, { recursive: true })
})
afterEach(() => rmSync(tmp, { recursive: true, force: true }))

describe('scaffold course', () => {
  it('renames, replaces placeholders and keeps mustache and Actions expressions', () => {
    const dir = join(tmp, 'demo kurs')
    const { created } = scaffold('course', courseOpts(dir))
    expect(created.length).toBeGreaterThan(5)
    expect(read(dir, '.gitignore')).toContain('node_modules')
    expect(existsSync(join(dir, '.gitattributes'))).toBe(true)
    expect(existsSync(join(dir, 'CLAUDE.md'))).toBe(true)
    expect(grepAll(dir, /%%[A-Za-z]+%%/)).toEqual([])
    expect(read(dir, 'site/App.vue')).toContain('{{ x }}')
    expect(read(dir, '.github/workflows/ci.yml')).toContain('${{ github.ref }}')
    expect(read(dir, 'README.md')).toContain('Course id: demo-kurs')
    const pkg = JSON.parse(read(dir, 'package.json'))
    expect(pkg.dependencies['@whz-ds-labs/ui']).toBe('0.0.0')
  })

  it('refuses a non-empty target and writes nothing', () => {
    const dir = join(tmp, 'demo')
    mkdirSync(dir)
    writeFileSync(join(dir, 'x.txt'), 'x')
    expect(() => scaffold('course', courseOpts(dir))).toThrow(/not empty/)
    expect(readdirSync(dir)).toEqual(['x.txt'])
  })

  it('accepts an existing empty target', () => {
    const dir = join(tmp, 'empty')
    mkdirSync(dir)
    scaffold('course', courseOpts(dir))
    expect(existsSync(join(dir, 'package.json'))).toBe(true)
  })

  it('rejects invalid ids', () => {
    for (const course of ['Bad_Id', 'a', '1abc', '-ab', 'a--b', 'knn-', 'x'.repeat(42)]) {
      expect(() => scaffold('course', { ...courseOpts(join(tmp, 'o')), course })).toThrow(/invalid id/)
    }
    expect(existsSync(join(tmp, 'o'))).toBe(false)
  })

  it('fails on an unknown placeholder and writes nothing', () => {
    writeFileSync(join(fx, 'course', 'README.md'), 'hello %%foo%%\n')
    const dir = join(tmp, 'o')
    expect(() => scaffold('course', courseOpts(dir))).toThrow(/unknown placeholder/)
    expect(existsSync(dir)).toBe(false)
  })

  it('copies binary files byte-exact', () => {
    const bytes = Buffer.from([0, 1, 2, 0xff, 0x25, 0x25, 0x61, 0x25, 0x25])
    writeFileSync(join(fx, 'course', 'logo.png'), bytes)
    const dir = join(tmp, 'o')
    scaffold('course', courseOpts(dir))
    expect(readFileSync(join(dir, 'logo.png')).equals(bytes)).toBe(true)
  })

  it('rejects titles with characters that could break generated code', () => {
    const dir = join(tmp, 'o')
    expect(() => scaffold('course', { ...courseOpts(dir), titleEn: 'Cost $& more' })).toThrow(/unsupported character/)
    expect(() => scaffold('course', { ...courseOpts(dir), titleDe: 'Say "hi"' })).toThrow(/unsupported character/)
    expect(existsSync(dir)).toBe(false)
  })

  it('--packs rewrites both framework dependencies to file: URLs with forward slashes', () => {
    const packs = join(tmp, 'packs dir')
    mkdirSync(packs)
    writeFileSync(join(packs, 'whz-ds-labs-ui-0.0.0.tgz'), 'x')
    writeFileSync(join(packs, 'whz-ds-labs-lab-kit-0.0.0.tgz'), 'x')
    const dir = join(tmp, 'o')
    scaffold('course', { ...courseOpts(dir), packs })
    const deps = JSON.parse(read(dir, 'package.json')).dependencies
    for (const name of ['@whz-ds-labs/ui', '@whz-ds-labs/lab-kit']) {
      expect(deps[name]).toMatch(/^file:/)
      expect(deps[name]).not.toContain('\\')
    }
    expect(deps['@whz-ds-labs/ui']).toContain('whz-ds-labs-ui-0.0.0.tgz')
    expect(deps['@whz-ds-labs/ui']).toContain('packs dir/')
    expect(deps['@whz-ds-labs/ui']).toMatch(/^file:([A-Za-z]:)?\//)
    expect(deps['@whz-ds-labs/lab-kit']).toContain('whz-ds-labs-lab-kit-0.0.0.tgz')
  })

  it('--packs requires exactly one tarball of each kind', () => {
    const packs = join(tmp, 'packs')
    mkdirSync(packs)
    writeFileSync(join(packs, 'whz-ds-labs-ui-0.0.0.tgz'), 'x')
    const dir = join(tmp, 'o')
    expect(() => scaffold('course', { ...courseOpts(dir), packs })).toThrow(/lab-kit/)
    expect(existsSync(dir)).toBe(false)
  })
})

describe('scaffold intern', () => {
  it('creates the intern repo', () => {
    const dir = join(tmp, 'intern')
    scaffold('intern', { dir, course: 'demo-kurs', templatesDir: fx })
    expect(read(dir, 'notes/README.md')).toContain('Materials')
    expect(read(dir, 'CLAUDE.md')).toContain('demo-kurs')
    expect(read(dir, '.gitignore')).toContain('materials')
  })
  it('refuses a non-empty target', () => {
    const dir = join(tmp, 'intern')
    mkdirSync(dir)
    writeFileSync(join(dir, 'a'), '')
    expect(() => scaffold('intern', { dir, course: 'demo-kurs', templatesDir: fx })).toThrow(/not empty/)
  })
})

describe('scaffold lab', () => {
  let dir: string
  const labOpts = (topic: string) => ({
    dir, topic, titleDe: 'Gerade', titleEn: 'Line fit', templatesDir: fx,
  })
  beforeEach(() => {
    dir = join(tmp, 'course dir')
    scaffold('course', courseOpts(dir))
  })

  it('writes the lab and inserts import and list entry before the markers', () => {
    const { created } = scaffold('lab', labOpts('line-fit'))
    expect(created.length).toBeGreaterThan(0)
    expect(read(dir, 'labs/line-fit/lab.ts')).toContain("id: 'line-fit'")
    expect(read(dir, 'labs/line-fit/Intro.vue')).toContain('{{ y }}')
    const course = read(dir, 'site/course.ts')
    expect(course).toMatch(/import \{ lab as lineFit \} from '\.\.\/labs\/line-fit\/lab'\n\/\/ ds-labs:lab-imports/)
    expect(course).toMatch(/ {4}lineFit,\n {4}\/\/ ds-labs:lab-list/)
  })

  it('adds a second lab keeping the first', () => {
    scaffold('lab', labOpts('line-fit'))
    scaffold('lab', labOpts('knn'))
    const course = read(dir, 'site/course.ts')
    expect(course).toContain('lineFit,')
    expect(course).toContain('knn,')
  })

  it('rejects invalid ids', () => {
    expect(() => scaffold('lab', labOpts('Bad_Id'))).toThrow(/invalid id/)
  })

  it('refuses an existing lab', () => {
    scaffold('lab', labOpts('line-fit'))
    expect(() => scaffold('lab', labOpts('line-fit'))).toThrow(/exists/)
  })

  it('refuses a course.ts without markers and leaves it unchanged', () => {
    const file = join(dir, 'site', 'course.ts')
    writeFileSync(file, 'export const course = {}\n// ds-labs:lab-imports\n')
    const before = readFileSync(file, 'utf8')
    expect(() => scaffold('lab', labOpts('line-fit'))).toThrow(/marker/)
    expect(readFileSync(file, 'utf8')).toBe(before)
    expect(existsSync(join(dir, 'labs', 'line-fit'))).toBe(false)
  })

  it('rejects ids that would yield invalid identifiers', () => {
    for (const t of ['a--b', 'knn-', '-knn']) expect(() => scaffold('lab', labOpts(t))).toThrow(/invalid id/)
    for (const t of ['default', 'new', 'class', 'delete']) {
      expect(() => scaffold('lab', labOpts(t))).toThrow(/reserved word/)
    }
    expect(existsSync(join(dir, 'labs', 'default'))).toBe(false)
  })

  it('refuses when the derived identifier is already imported', () => {
    scaffold('lab', labOpts('a1'))
    const before = read(dir, 'site/course.ts')
    expect(() => scaffold('lab', labOpts('a-1'))).toThrow(/already imports/)
    expect(read(dir, 'site/course.ts')).toBe(before)
    expect(existsSync(join(dir, 'labs', 'a-1'))).toBe(false)
  })

  it('refuses a course.ts without the import marker and leaves it unchanged', () => {
    const file = join(dir, 'site', 'course.ts')
    writeFileSync(file, 'export const course = {\n  // ds-labs:lab-list\n}\n')
    const before = readFileSync(file, 'utf8')
    expect(() => scaffold('lab', labOpts('line-fit'))).toThrow(/ds-labs:lab-imports/)
    expect(readFileSync(file, 'utf8')).toBe(before)
    expect(existsSync(join(dir, 'labs', 'line-fit'))).toBe(false)
  })

  it('keeps CRLF line endings when inserting at the markers', () => {
    const file = join(dir, 'site', 'course.ts')
    writeFileSync(file, readFileSync(file, 'utf8').replace(/\n/g, '\r\n'))
    scaffold('lab', labOpts('line-fit'))
    const course = readFileSync(file, 'utf8')
    expect(course).toContain("lab'\r\n// ds-labs:lab-imports")
    expect(course).toContain('    lineFit,\r\n    // ds-labs:lab-list')
    expect(course.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('writes nothing on an unknown placeholder', () => {
    writeFileSync(join(fx, 'lab', 'lab.ts'), 'x %%foo%%\n')
    const before = read(dir, 'site/course.ts')
    expect(() => scaffold('lab', labOpts('line-fit'))).toThrow(/unknown placeholder/)
    expect(read(dir, 'site/course.ts')).toBe(before)
    expect(existsSync(join(dir, 'labs', 'line-fit'))).toBe(false)
  })
})

describe('scaffold CLI', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' })

  it('exits 1 with a one-line reason on usage errors', () => {
    const r = run('course', '--dir', join(tmp, 'x'))
    expect(r.status).toBe(1)
    expect(r.stderr.trim().split('\n')).toHaveLength(1)
    expect(existsSync(join(tmp, 'x'))).toBe(false)
    expect(run('bogus').status).toBe(1)
    expect(run().status).toBe(1)
  })

  it('succeeds with exit 0 and prints created paths', () => {
    const dir = join(tmp, 'my course')
    const r = run('course', '--dir', dir, '--course', 'demo-kurs', '--title-de', 'Demo DE', '--title-en', 'Demo EN', '--templates', fx)
    expect(r.status, r.stderr).toBe(0)
    const lines = r.stdout.trim().split(/\r?\n/)
    expect(lines.length).toBeGreaterThan(5)
    expect(lines.some((l) => l.endsWith('package.json'))).toBe(true)
    for (const l of lines) expect(existsSync(l)).toBe(true)
  })

  it('exits 1 on validation errors (invalid id) without writing', () => {
    const dir = join(tmp, 'y')
    const r = run('course', '--dir', dir, '--course', 'Bad', '--title-de', 'a', '--title-en', 'b')
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/invalid id/)
    expect(existsSync(dir)).toBe(false)
  })
})
