// Builds both framework packages and packs them into tarballs.
//   node scripts/pack.mjs [<outDir>]      (default: .local-packs)
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function quote(arg) {
  return /[\s"&|<>^()]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg
}

/**
 * Runs a command through the shell (needed for npm.cmd on Windows) and returns the result.
 * `capture` collects stdout instead of streaming it.
 */
export function sh(command, args, { cwd = repoRoot, env = {}, capture = false } = {}) {
  const line = [command, ...args.map(quote)].join(' ')
  return spawnSync(line, {
    cwd,
    env: { ...process.env, ...env },
    shell: true,
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
}

/** Like `sh`, but throws an Error naming the failing command. */
export function shOrThrow(command, args, options) {
  const r = sh(command, args, options)
  if (r.error || r.status !== 0) {
    const why = r.error ? r.error.message : `exit code ${r.status}`
    throw new Error(`command failed (${why}): ${[command, ...args].join(' ')}`)
  }
  return r
}

/**
 * Empties `outDir`, builds both packages and packs them there.
 * @param {string} outDir relative paths are resolved against the repository root
 * @returns {Promise<{ ui: string; labKit: string }>} absolute tarball paths
 */
export async function packAll(outDir) {
  const out = resolve(repoRoot, outDir)
  const rel = relative(out, repoRoot)
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
    throw new Error(`refusing to empty ${out}: it contains the repository`)
  }
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  shOrThrow('npm', ['run', 'build'])
  for (const name of ['@whz-ds-labs/ui', '@whz-ds-labs/lab-kit']) {
    shOrThrow('npm', ['pack', '-w', name, '--pack-destination', out])
  }
  const names = readdirSync(out)
  const pick = (re) => {
    const hits = names.filter((n) => re.test(n))
    if (hits.length !== 1) throw new Error(`expected exactly one tarball matching ${re} in ${out}, found ${hits.length}`)
    return resolve(out, hits[0])
  }
  return { ui: pick(/^whz-ds-labs-ui-.*\.tgz$/), labKit: pick(/^whz-ds-labs-lab-kit-.*\.tgz$/) }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  packAll(process.argv[2] ?? '.local-packs').then(
    (r) => console.log(JSON.stringify(r, null, 2)),
    (err) => {
      console.error(err instanceof Error ? err.message : String(err))
      process.exitCode = 1
    },
  )
}
