import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const chapters = ['01-start', '02-architecture', '03-design', '04-release', '05-handover', '06-decisions'].map((c) => `${c}.md`)

const read = (rel: string): string => readFileSync(join(repo, rel), 'utf8')
const mdFiles = (dir: string): string[] =>
  existsSync(join(repo, dir)) ? readdirSync(join(repo, dir)).filter((f) => f.endsWith('.md')).sort() : []

/** Lines outside fenced code blocks. */
function proseLines(text: string): string[] {
  const out: string[] = []
  let fence = false
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      fence = !fence
      continue
    }
    if (!fence) out.push(line)
  }
  return out
}

function headingCounts(text: string): { h1: number; h2: number } {
  const lines = proseLines(text)
  return {
    h1: lines.filter((l) => /^# /.test(l)).length,
    h2: lines.filter((l) => /^## /.test(l)).length,
  }
}

function fencedBlocks(text: string, lang: string): string[] {
  const blocks: string[] = []
  const re = new RegExp('^```' + lang + '[ \\t]*\\r?\\n([\\s\\S]*?)^```', 'gm')
  for (const m of text.matchAll(re)) blocks.push(m[1] ?? '')
  return blocks
}

function relativeLinks(text: string): string[] {
  const links: string[] = []
  for (const line of proseLines(text)) {
    for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) links.push(m[1] ?? '')
  }
  return links.filter((l) => !/^([a-z][a-z0-9+.-]*:|#)/i.test(l))
}

describe('handbook structure', () => {
  it('has the same six chapters in docs/de and docs/en', () => {
    expect(mdFiles('docs/de')).toEqual(chapters)
    expect(mdFiles('docs/en')).toEqual(chapters)
  })

  it.each(chapters)('%s has the same number of # and ## headings in DE and EN', (file) => {
    const de = headingCounts(read(`docs/de/${file}`))
    const en = headingCounts(read(`docs/en/${file}`))
    expect(de.h1).toBe(1)
    expect(en.h1).toBe(1)
    expect(en).toEqual(de)
    expect(de.h2).toBeGreaterThan(0)
  })
})

describe('handbook content', () => {
  const docs = ['de', 'en'].flatMap((lang) => chapters.map((c) => `docs/${lang}/${c}`))
  const all = [...docs, 'README.md', 'packages/lab-kit/README.md', 'packages/ui/README.md']

  it.each(all)('%s: every relative link resolves', (file) => {
    for (const link of relativeLinks(read(file))) {
      const target = link.split('#')[0] ?? ''
      if (target === '') continue
      expect(existsSync(resolve(repo, dirname(file), decodeURI(target))), `${file} -> ${link}`).toBe(true)
    }
  })

  it.each(docs)('%s: no && inside a powershell block', (file) => {
    for (const block of fencedBlocks(read(file), 'powershell')) {
      expect(block, `${file} has && in a powershell block`).not.toContain('&&')
    }
  })

  it.each(['docs/de/06-decisions.md', 'docs/en/06-decisions.md'])('%s mentions every decision id', (file) => {
    const text = read(file)
    const ids = [...Array.from({ length: 8 }, (_, i) => `E${i + 1}`), ...Array.from({ length: 10 }, (_, i) => `F${i + 1}`)]
    for (const id of ids) expect(text, `${file} lacks ${id}`).toMatch(new RegExp(`\\b${id}\\b`))
  })

  it.each(docs)('%s: no internal paths or private material references', (file) => {
    const text = read(file)
    expect(text).not.toContain('docs/superpowers')
    expect(text).not.toContain('decision-trees')
    expect(text).not.toMatch(/gesamtkonzept-design|framework-v0.1-design/)
  })

  it('the root README links to the first chapter in both languages', () => {
    const links = relativeLinks(read('README.md'))
    expect(links).toContain('docs/de/01-start.md')
    expect(links).toContain('docs/en/01-start.md')
  })
})
