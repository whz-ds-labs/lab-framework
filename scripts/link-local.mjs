// Installs the locally built framework into a course repo without touching its package.json or lockfile.
//   node scripts/link-local.mjs <course-dir>
// Method: build and pack both packages into .local-packs/, then `npm install --no-save <ui.tgz> <lab-kit.tgz>` in the
// course directory. Undo with `npm ci` in the course repo.
import { existsSync, realpathSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { packAll, sh, shOrThrow } from './pack.mjs'

/** Counts installed copies of the given packages from `npm ls --parseable` output (one path per line). */
export function countCopies(parseable, names) {
  const seen = Object.fromEntries(names.map((n) => [n, new Set()]))
  for (const line of parseable.split(/\r?\n/)) {
    const path = line.trim().split('\\').join('/')
    for (const n of names) {
      if (path.endsWith(`/node_modules/${n}`)) seen[n].add(path)
    }
  }
  return Object.fromEntries(names.map((n) => [n, seen[n].size]))
}

export async function linkLocal(courseDir) {
  const dir = resolve(courseDir)
  if (!existsSync(dir) || !statSync(dir).isDirectory() || !existsSync(resolve(dir, 'package.json'))) {
    throw new Error(`not a course directory (no package.json): ${dir}`)
  }
  const { ui, labKit } = await packAll('.local-packs')
  // Both tarballs in one install, paths with forward slashes.
  const tarballs = [ui, labKit].map((p) => p.split('\\').join('/'))
  shOrThrow('npm', ['install', '--no-save', ...tarballs], { cwd: dir })

  const pkgs = ['@whz-ds-labs/ui', '@whz-ds-labs/lab-kit', 'vue']
  console.log(`\n> npm ls ${pkgs.join(' ')}`)
  sh('npm', ['ls', ...pkgs], { cwd: dir })

  const listing = sh('npm', ['ls', ...pkgs, '--all', '--parseable'], { cwd: dir, capture: true })
  if (listing.error || listing.status !== 0) {
    throw new Error(`npm ls --parseable failed (${listing.error ? listing.error.message : `exit code ${listing.status}`})`)
  }
  const counts = countCopies(listing.stdout ?? '', ['vue', '@whz-ds-labs/lab-kit'])
  const dup = Object.entries(counts).filter(([, n]) => n > 1)
  if (dup.length > 0) {
    throw new Error(`more than one installed copy: ${dup.map(([n, c]) => `${n} x${c}`).join(', ')}`)
  }
  console.log('\nUndo: run `npm ci` in the course repo (re-run this script after any later npm install, uninstall or ci).')
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
  const target = process.argv[2]
  if (!target) {
    console.error('usage: node scripts/link-local.mjs <course-dir>')
    process.exitCode = 1
  } else {
    linkLocal(target).catch((err) => {
      console.error(err instanceof Error ? err.message : String(err))
      process.exitCode = 1
    })
  }
}

