import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Lab folder names below `labs/` (directories only). */
export function allLabs(root = '.') {
  const dir = `${root}/labs`
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
}

/**
 * Labs affected by the changed files: the labs touched under `labs/<name>/`, or every lab when anything
 * outside `labs/` changed (site, scripts, dependencies, ...). Returns `labs/<name>` paths.
 */
export function changedLabs(files, labs) {
  const names = files.map((f) => f.split('\\').join('/'))
  if (names.some((f) => !f.startsWith('labs/'))) return labs.map((l) => `labs/${l}`)
  const touched = new Set(names.map((f) => f.split('/')[1]).filter((n) => labs.includes(n)))
  return [...touched].sort().map((l) => `labs/${l}`)
}

function main(argv) {
  const i = argv.indexOf('--base')
  const base = i >= 0 ? argv[i + 1] : undefined
  if (!base) {
    console.error('usage: changed-labs.mjs --base <git ref>')
    return 1
  }
  const labs = allLabs()
  let files
  try {
    files = execFileSync('git', ['diff', '--name-only', '-z', `${base}...HEAD`], { encoding: 'utf8' })
      .split('\0')
      .filter((f) => f.length > 0)
  } catch {
    // Unknown base (new branch, shallow clone): be safe and test everything.
    console.log(labs.map((l) => `labs/${l}`).join(' '))
    return 0
  }
  console.log(changedLabs(files, labs).join(' '))
  return 0
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
