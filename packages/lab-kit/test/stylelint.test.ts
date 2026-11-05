import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import stylelint from 'stylelint'
import { describe, expect, it } from 'vitest'
import plugins from '../src/stylelint/index'

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'stylelint')

async function lint(file: string) {
  const result = await stylelint.lint({
    files: [join(fixtures, file)],
    config: {
      plugins,
      rules: { 'ds-labs/no-separator-lines': true, 'ds-labs/color-tokens-only': true },
      overrides: [{ files: ['**/*.vue'], customSyntax: 'postcss-html' }],
    },
  })
  const r = result.results[0]!
  expect(r.parseErrors).toEqual([])
  return r.warnings.toSorted((a, b) => a.line - b.line).map((w) => `${w.rule}@${w.line}`)
}

const SEP = 'ds-labs/no-separator-lines'
const COL = 'ds-labs/color-tokens-only'

describe('plugin objects', () => {
  it('exports exactly the two rules, each with ruleName and rule', () => {
    expect(plugins.map((p) => p.ruleName)).toEqual([SEP, COL])
    for (const p of plugins) expect(typeof p.rule).toBe('function')
  })
})

describe('good fixtures produce no warnings', () => {
  for (const f of ['good/tokens.css', 'good/input.css', 'good/scoped.vue']) {
    it(f, async () => {
      expect(await lint(f)).toEqual([])
    })
  }
})

describe('bad fixtures', () => {
  it('flags every separator-producing border declaration', async () => {
    expect(await lint('bad/border.css')).toEqual([2, 3, 4, 5, 6, 7, 8].map((l) => `${SEP}@${l}`))
  })

  it('flags hr type selectors but not other selectors in the same file', async () => {
    expect(await lint('bad/hr.css')).toEqual([`${SEP}@1`, `${SEP}@5`])
  })

  it('flags hex, color functions (also in custom properties and var fallbacks) and named colors', async () => {
    expect(await lint('bad/colors.css')).toEqual([2, 3, 4, 5, 6, 7, 8].map((l) => `${COL}@${l}`))
  })

  it('reports an allow comment without a reason once, instead of the suppressed violation', async () => {
    expect(await lint('bad/empty-reason.css')).toEqual([`${SEP}@2`])
  })

  it('works inside <style scoped> of a .vue file with the right line numbers', async () => {
    expect(await lint('bad/scoped.vue')).toEqual([`${COL}@7`, `${SEP}@8`])
  })

  it('has the message for the empty reason', async () => {
    const r = await stylelint.lint({
      code: readFileSync(join(fixtures, 'bad/empty-reason.css'), 'utf8'),
      config: { plugins, rules: { [SEP]: true } },
    })
    expect(r.results[0]!.warnings[0]!.text).toContain('ds-labs-allow needs a reason')
  })
})
