import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { emptyDemo, restoreTracked } from '../scripts/integration.mjs'

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
