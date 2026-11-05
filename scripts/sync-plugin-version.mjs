// Keeps the plugin manifests in step with plugin/package.json and checks that
// all published artifacts share one version.
//   node scripts/sync-plugin-version.mjs           copy plugin/package.json version into both manifests
//   node scripts/sync-plugin-version.mjs --check   exit 1 and list mismatches
// Test hook: --root <dir> reads/writes below <dir> instead of the repository root.
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const files = {
  plugin: 'plugin/package.json',
  pluginJson: 'plugin/.claude-plugin/plugin.json',
  marketplace: '.claude-plugin/marketplace.json',
  labKit: 'packages/lab-kit/package.json',
  ui: 'packages/ui/package.json',
}

const readJson = (root, rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'))

export function readVersions(root = defaultRoot) {
  const marketplace = readJson(root, files.marketplace)
  const entry = (marketplace.plugins ?? []).find((p) => p.name === 'ds-labs')
  const ui = readJson(root, files.ui)
  return {
    plugin: readJson(root, files.plugin).version,
    pluginJson: readJson(root, files.pluginJson).version,
    marketplace: entry?.version,
    labKit: readJson(root, files.labKit).version,
    ui: ui.version,
    uiDepOnLabKit: ui.dependencies?.['@whz-ds-labs/lab-kit'],
  }
}

export function findMismatches(versions) {
  return Object.entries(versions)
    .filter(([, v]) => v !== versions.plugin)
    .map(([k, v]) => `${k}: ${v === undefined ? '<missing>' : v} (expected ${versions.plugin})`)
}

function writeJson(root, rel, mutate) {
  const file = join(root, rel)
  const json = JSON.parse(readFileSync(file, 'utf8'))
  mutate(json)
  writeFileSync(file, JSON.stringify(json, null, 2) + '\n')
}

export function syncVersions(root = defaultRoot) {
  const { plugin } = readVersions(root)
  writeJson(root, files.pluginJson, (j) => {
    j.version = plugin
  })
  writeJson(root, files.marketplace, (j) => {
    const entry = (j.plugins ?? []).find((p) => p.name === 'ds-labs')
    if (!entry) throw new Error('marketplace.json has no plugin entry "ds-labs"')
    entry.version = plugin
  })
  return plugin
}

function main(argv) {
  const rootIdx = argv.indexOf('--root')
  const root = rootIdx >= 0 ? resolve(argv[rootIdx + 1] ?? '') : defaultRoot
  try {
    if (argv.includes('--check')) {
      const bad = findMismatches(readVersions(root))
      if (bad.length > 0) {
        console.error('Version mismatch:\n' + bad.map((l) => `  ${l}`).join('\n'))
        return 1
      }
      console.log('versions ok')
      return 0
    }
    console.log(`synced plugin manifests to ${syncVersions(root)}`)
    return 0
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`)
    return 1
  }
}

function isEntryPoint() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isEntryPoint()) {
  process.exitCode = main(process.argv.slice(2))
}
