import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { distAvailable, packageRoot } from './helpers/dist'

// Throws under CI when dist/ is missing; skips locally with a warning.
const built = distAvailable()

describe.skipIf(!built)('built bundle', () => {
  const js = () => readFileSync(join(packageRoot, 'dist', 'index.js'), 'utf8')

  it('imports lab-kit and vue as externals (one shared copy)', () => {
    expect(js()).toMatch(/from\s*["']@whz-ds-labs\/lab-kit["']/)
    expect(js()).toMatch(/from\s*["']vue["']/)
  })

  it('does not bundle a second language store', () => {
    expect(js()).not.toContain('ds-labs-lang')
  })

  it('keeps katex and d3-scale external', () => {
    expect(js()).toMatch(/from\s*["']katex["']/)
    expect(js()).toMatch(/from\s*["']d3-scale["']/)
  })
})

describe('sources follow design v0', () => {
  it('has no hr elements', () => {
    const dir = join(packageRoot, 'src')
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.vue'))) {
      expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/<hr[\s>/]/)
    }
  })
})
