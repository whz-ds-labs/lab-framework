import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LabDefinition } from '../src/define'
import { catalogParity, expectClose, loadGolden, missingLabMessages } from '../src/testing/index'
import { demoLab } from './fixtures/demoLab'

describe('expectClose', () => {
  it('passes within tolerance for scalars and arrays', () => {
    expectClose(1, 1 + 1e-10)
    expectClose([1, 2, 3], [1, 2, 3])
  })

  it('passes near zero through atol', () => {
    expectClose(5e-13, 0)
  })

  it('honours custom tolerances', () => {
    expectClose(1.05, 1, { rtol: 0.1 })
    expect(() => expectClose(1.05, 1, { rtol: 0.01 })).toThrow(Error)
    expectClose(0.4, 0, { atol: 0.5 })
  })

  it('names index, actual, expected and tolerance on failure', () => {
    let msg = ''
    try {
      expectClose([1, 2, 3.5], [1, 2, 3])
    } catch (e) {
      msg = (e as Error).message
    }
    expect(msg).toContain('2')
    expect(msg).toContain('3.5')
    expect(msg).toContain('3')
    expect(msg).toContain('rtol')
    expect(msg).toContain('atol')
  })

  it('fails on length mismatch and on scalar vs array', () => {
    expect(() => expectClose([1, 2], [1, 2, 3])).toThrow(/length/)
    expect(() => expectClose(1, [1])).toThrow(Error)
  })

  it('fails on NaN', () => {
    expect(() => expectClose(NaN, 1)).toThrow(Error)
    expect(() => expectClose(NaN, NaN)).toThrow(Error)
  })
})

describe('catalogParity', () => {
  it('is empty for equal catalogs', () => {
    expect(catalogParity(demoLab.messages.de, demoLab.messages.en)).toEqual([])
  })

  it('reports keys missing in either language', () => {
    const lines = catalogParity({ a: { b: 'x' }, c: 'y' }, { a: { b: 'x' }, d: 'z' })
    expect(lines).toHaveLength(2)
    expect(lines.join('\n')).toContain('c')
    expect(lines.join('\n')).toContain('d')
    expect(lines.find((l) => l.includes('c'))).toMatch(/en/)
    expect(lines.find((l) => l.includes('d'))).toMatch(/de/)
  })

  it('reports placeholder mismatches', () => {
    const lines = catalogParity({ k: 'Hallo {name}' }, { k: 'Hello {who}' })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('k')
    expect(lines[0]).toContain('name')
    expect(lines[0]).toContain('who')
  })
})

describe('missingLabMessages', () => {
  it('is empty for the complete fixture lab', () => {
    expect(missingLabMessages(demoLab)).toEqual([])
  })

  it('reports exactly one removed help key', () => {
    const de = structuredClone(demoLab.messages.de) as any
    delete de.alpha.help.controls.mode
    const lab: LabDefinition = { ...demoLab, messages: { ...demoLab.messages, de } }
    expect(missingLabMessages(lab)).toEqual(['de: demo.alpha.help.controls.mode'])
  })

  it('reports in both languages, covers scenario, title and label keys, skips literals', () => {
    const de = structuredClone(demoLab.messages.de) as any
    const en = structuredClone(demoLab.messages.en) as any
    delete de.scenario.a1.watch
    delete en.alpha.plot.title
    delete en.alpha.n.label
    delete de.beta.help.purpose
    const lab: LabDefinition = { ...demoLab, messages: { de, en } }
    const out = missingLabMessages(lab)
    expect(out.sort()).toEqual(
      [
        'de: demo.scenario.a1.watch',
        'de: demo.beta.help.purpose',
        'en: demo.alpha.n.label',
        'en: demo.alpha.plot.title',
      ].sort(),
    )
    expect(out.join('\n')).not.toContain('a | b')
  })
})

describe('loadGolden', () => {
  it('reads <dir>/<name>.json from a path and from a URL', () => {
    const dir = mkdtempSync(join(tmpdir(), 'golden-'))
    writeFileSync(join(dir, 'case.json'), JSON.stringify({ x: [1, 2] }))
    expect(loadGolden(dir, 'case')).toEqual({ x: [1, 2] })
    expect(loadGolden(pathToFileURL(dir + '/'), 'case')).toEqual({ x: [1, 2] })
  })

  it('accepts URL-like objects and the happy-dom URL', () => {
    const dir = mkdtempSync(join(tmpdir(), 'golden-'))
    writeFileSync(join(dir, 'case.json'), JSON.stringify({ x: [3] }))
    const href = pathToFileURL(dir + '/').href
    expect(loadGolden({ href }, 'case')).toEqual({ x: [3] })
    expect(loadGolden(new globalThis.URL(href), 'case')).toEqual({ x: [3] })
  })

  it('throws for a missing file', () => {
    expect(() => loadGolden(tmpdir(), 'does-not-exist-xyz')).toThrow()
  })
})
