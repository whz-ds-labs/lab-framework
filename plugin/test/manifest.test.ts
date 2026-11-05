import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pluginDir = join(repo, 'plugin')
const json = (p: string) => JSON.parse(readFileSync(p, 'utf8'))

function frontmatter(file: string): string {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'))
  expect(m, `${file} has frontmatter`).not.toBeNull()
  return m![1]
}

describe('plugin manifests', () => {
  it('plugin.json has the required fields', () => {
    const p = json(join(pluginDir, '.claude-plugin', 'plugin.json'))
    expect(p.name).toBe('ds-labs')
    expect(p.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(p.description).toBeTruthy()
    expect(p.author.name).toBe('whz-ds-labs contributors')
    expect(p.license).toBe('MIT')
    expect(p.repository).toMatch(/^https:\/\/github\.com\/whz-ds-labs\/lab-framework/)
  })

  it('marketplace.json lists the plugin with an existing source folder', () => {
    const m = json(join(repo, '.claude-plugin', 'marketplace.json'))
    expect(m.name).toBe('whz-ds-labs')
    expect(m.owner.name).toBe('whz-ds-labs')
    expect(m.metadata.description).toBeTruthy()
    expect(m.plugins).toHaveLength(1)
    const entry = m.plugins[0]
    expect(entry.name).toBe('ds-labs')
    expect(entry.description).toBeTruthy()
    expect(entry.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(existsSync(resolve(repo, entry.source))).toBe(true)
  })

  it('plugin package.json is the private ds-labs-plugin', () => {
    const p = json(join(pluginDir, 'package.json'))
    expect(p).toMatchObject({ name: 'ds-labs-plugin', private: true, type: 'module' })
  })

  it('every skill has name and description frontmatter and no allowed-tools', () => {
    const skills = join(pluginDir, 'skills')
    if (!existsSync(skills)) return
    for (const d of readdirSync(skills, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const fm = frontmatter(join(skills, d.name, 'SKILL.md'))
      expect(fm, d.name).toMatch(/^name:\s*\S/m)
      expect(fm, d.name).toMatch(/^description:\s*\S/m)
      expect(fm, d.name).not.toMatch(/allowed-tools/)
    }
  })

  it('every agent file has name and description frontmatter', () => {
    const agents = join(pluginDir, 'agents')
    if (!existsSync(agents)) return
    for (const f of readdirSync(agents).filter((n) => n.endsWith('.md'))) {
      const fm = frontmatter(join(agents, f))
      expect(fm, f).toMatch(/^name:\s*\S/m)
      expect(fm, f).toMatch(/^description:\s*\S/m)
    }
  })
})
