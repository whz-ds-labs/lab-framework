// Installs the locally built framework into a course repo without touching its package.json or lockfile.
//   node scripts/link-local.mjs <course-dir>
// Method: build and pack both packages into .local-packs/, then `npm install --no-save <ui.tgz> <lab-kit.tgz>` in the
// course directory. Undo with `npm ci` in the course repo.
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, resolve } from 'node:path'
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

/**
 * Decides what a finished `npm ls --parseable` run means. npm exits non-zero when an installed
 * tarball version does not satisfy the version the course pins (it marks the package "invalid"),
 * although it still prints every path - so a non-zero exit alone is not fatal. Only a spawn error
 * or empty output is. Duplicate copies are detected from the printed paths.
 * @param {{ error?: Error | null, status?: number | null, stdout?: string | null }} listing
 * @param {string[]} names packages that must exist exactly once
 * @returns {{ fatal: string | null, duplicates: [string, number][], nonZeroExit: boolean }}
 */
export function evaluateListing(listing, names) {
  const nonZeroExit = !listing.error && listing.status !== 0
  if (listing.error) {
    return { fatal: `npm ls --parseable failed (${listing.error.message})`, duplicates: [], nonZeroExit }
  }
  const stdout = listing.stdout ?? ''
  if (stdout.trim() === '') {
    return { fatal: `npm ls --parseable printed no paths (exit code ${listing.status})`, duplicates: [], nonZeroExit }
  }
  const counts = countCopies(stdout, names)
  return { fatal: null, duplicates: Object.entries(counts).filter(([, n]) => n > 1), nonZeroExit }
}

/** Extracts the version from a packed tarball path such as `.../whz-ds-labs-ui-0.1.0.tgz`. */
export function tarballVersion(tarball) {
  const m = /-(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.tgz$/.exec(basename(tarball.split('\\').join('/')))
  return m ? m[1] : null
}

/**
 * Lists the framework packages the course pins to a version other than the linked tarball.
 * @param {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }} pkg course package.json
 * @param {Record<string, string | null>} linked package name -> version of the linked tarball
 * @returns {{ name: string, pinned: string, linked: string }[]}
 */
export function pinMismatches(pkg, linked) {
  const out = []
  for (const [name, linkedVersion] of Object.entries(linked)) {
    const pinned = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]
    if (pinned && linkedVersion && pinned !== linkedVersion) out.push({ name, pinned, linked: linkedVersion })
  }
  return out
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
  const result = evaluateListing(listing, ['vue', '@whz-ds-labs/lab-kit'])
  if (result.fatal) throw new Error(result.fatal)
  if (result.duplicates.length > 0) {
    throw new Error(`more than one installed copy: ${result.duplicates.map(([n, c]) => `${n} x${c}`).join(', ')}`)
  }

  const linked = { '@whz-ds-labs/ui': tarballVersion(ui), '@whz-ds-labs/lab-kit': tarballVersion(labKit) }
  const mismatches = pinMismatches(JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')), linked)
  if (mismatches.length > 0) {
    console.log(
      `\nNote: the course pins ${mismatches.map((m) => `${m.name}@${m.pinned}`).join(', ')}, but the linked tarballs are ` +
        `${mismatches.map((m) => m.linked).join(', ')}. npm reports such a package as "invalid" in the listing above ` +
        '(and exits non-zero); the linked build is installed and used anyway.',
    )
  } else if (result.nonZeroExit) {
    console.log('\nNote: npm ls exited non-zero (see its messages above), but every package was found exactly once.')
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

