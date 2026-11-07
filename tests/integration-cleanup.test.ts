import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { emptyDemo, parseFlags, restoreTracked, run } from '../scripts/integration.mjs'

describe('demo cleanup helpers', () => {
  it('empties the folder and restores .gitkeep and README.md byte for byte', () => {
    const dir = mkdtempSync(join(tmpdir(), 'demo-'))
    try {
      writeFileSync(join(dir, '.gitkeep'), '')
      writeFileSync(join(dir, 'README.md'), 'hello\n')
      writeFileSync(join(dir, 'package.json'), '{}')
      mkdirSync(join(dir, 'node_modules'))
      const saved = emptyDemo(dir)
      expect(existsSync(join(dir, 'package.json'))).toBe(false)
      expect(existsSync(join(dir, 'node_modules'))).toBe(false)
      restoreTracked(dir, saved)
      expect(existsSync(join(dir, '.gitkeep'))).toBe(true)
      expect(readFileSync(join(dir, 'README.md'), 'utf8')).toBe('hello\n')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('integration CLI flags', () => {
  it('parses --dir together with the other flags', () => {
    expect(parseFlags(['--dir', '/tmp/x', '--keep', '--skip-e2e'])).toEqual({ dir: '/tmp/x', keep: true, noLab: false, skipE2e: true })
    expect(parseFlags([])).toEqual({ keep: false, noLab: false, skipE2e: false })
  })
  it('rejects --dir without a path and unknown options', () => {
    expect(() => parseFlags(['--dir'])).toThrow(/needs a path/)
    expect(() => parseFlags(['--dir', '--keep'])).toThrow(/needs a path/)
    expect(() => parseFlags(['--nope'])).toThrow(/unknown option/)
  })
  it('refuses a non-empty --dir before touching anything', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'demo-nonempty-'))
    try {
      writeFileSync(join(dir, 'x.txt'), 'x')
      await expect(run({ dir })).rejects.toThrow(/must not exist or be empty/)
      expect(existsSync(join(dir, 'x.txt'))).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
