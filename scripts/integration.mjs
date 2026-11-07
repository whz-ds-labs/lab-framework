// End-to-end check of the framework as a course repo would use it: pack, scaffold, install, lint, type-check, test, build, e2e.
//   node scripts/integration.mjs [--dir <path>] [--keep] [--no-lab] [--skip-e2e]
//   --dir <path> run in this directory (must not exist or be empty) instead of examples/demo-kurs. Use a path OUTSIDE the
//                repository (CI does): inside it, Node, Vite and TypeScript resolve packages from the framework's own
//                node_modules and would hide dependencies missing from the course template.
//   --keep       keep the directory after a successful run (default: empty examples/demo-kurs again, delete a --dir; a failed run always keeps it)
//   --no-lab     only the empty course, no ausgleichsgerade lab
//   --skip-e2e   skip the Playwright run
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scaffold } from '../plugin/scripts/scaffold.mjs'
import { packAll, repoRoot, shOrThrow } from './pack.mjs'

const DEMO_ID = 'demo-kurs'
const DEFAULT_DEMO = resolve(repoRoot, 'examples', DEMO_ID)
const KEEP_FILES = ['.gitkeep', 'README.md']

function step(label) {
  console.log(`\n=== ${label} ===`)
}

/** Empties the demo folder except the two tracked files and returns their contents so they can be restored. */
export function emptyDemo(demo) {
  mkdirSync(demo, { recursive: true })
  const saved = {}
  for (const f of KEEP_FILES) {
    const p = join(demo, f)
    if (existsSync(p)) saved[f] = readFileSync(p)
  }
  try {
    for (const entry of readdirSync(demo)) rmSync(join(demo, entry), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  } catch (err) {
    // A failed delete (e.g. EPERM on node_modules) must not leave the tracked files deleted.
    restoreTracked(demo, saved)
    throw err
  }
  return saved
}

export function restoreTracked(demo, saved) {
  for (const [f, content] of Object.entries(saved)) writeFileSync(join(demo, f), content)
}

/** The built index.html may only reference assets below the deploy base. */
function checkBuild(demo, { lab }) {
  const html = readFileSync(join(demo, 'dist', 'index.html'), 'utf8')
  const urls = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1])
  const rooted = urls.filter((u) => u.startsWith('/'))
  const bad = rooted.filter((u) => !u.startsWith(`/${DEMO_ID}/assets/`))
  if (bad.length > 0) throw new Error(`dist/index.html references paths outside /${DEMO_ID}/assets/: ${bad.join(', ')}`)
  if (rooted.length === 0) throw new Error('dist/index.html references no assets')
  if (lab) {
    const assets = readdirSync(join(demo, 'dist', 'assets'))
    if (!assets.some((n) => /\.worker-.*\.js$/.test(n))) throw new Error('no *.worker-*.js in dist/assets')
  }
  console.log(`build ok: ${rooted.length} asset reference(s) below /${DEMO_ID}/assets/`)
}

/**
 * @param {{ dir?: string; keep?: boolean; noLab?: boolean; skipE2e?: boolean }} opts
 * @returns {Promise<void>} rejects with the failing command named in the message
 */
export async function run(opts = {}) {
  // The default folder is tracked (.gitkeep, README.md) and is emptied/restored; a --dir folder is created fresh.
  const custom = opts.dir !== undefined && resolve(opts.dir) !== DEFAULT_DEMO
  const demo = custom ? resolve(opts.dir) : DEFAULT_DEMO
  if (custom && existsSync(demo) && readdirSync(demo).length > 0) throw new Error(`--dir must not exist or be empty: ${demo}`)
  const inDemo = (command, args, env = {}) => {
    console.log(`\n> ${[command, ...args].join(' ')}`)
    shOrThrow(command, args, { cwd: demo, env })
  }

  step('pack framework')
  const packsDir = '.local-packs'
  // pack first: a build failure must not touch an existing demo.
  await packAll(packsDir)

  step('scaffold course')
  const saved = custom ? {} : emptyDemo(demo)
  try {
    scaffold('course', {
      dir: demo,
      course: DEMO_ID,
      titleDe: 'Demo-Kurs',
      titleEn: 'Demo course',
      packs: resolve(repoRoot, packsDir),
    })
  } finally {
    restoreTracked(demo, saved)
  }
  if (custom) {
    // Outside the framework repo the folder is no git repo; the guard reads `git ls-files`, as in a real course repo.
    inDemo('git', ['init', '-q'])
    inDemo('git', ['add', '-A'])
  }
  if (!opts.noLab) {
    step('scaffold lab')
    scaffold('lab', { dir: demo, topic: 'ausgleichsgerade', titleDe: 'Ausgleichsgerade', titleEn: 'Least squares line' })
    if (custom) inDemo('git', ['add', '-A'])
  }

  step('install')
  inDemo('npm', ['install'])
  inDemo('npx', ['playwright', 'install', ...(process.platform === 'linux' ? ['--with-deps'] : []), 'chromium'])

  step('checks')
  inDemo('npm', ['run', 'guard'])
  inDemo('npm', ['run', 'lint:css'])
  inDemo('npx', ['vue-tsc', '--noEmit'])
  inDemo('npm', ['test'])
  inDemo('npm', ['run', 'test:py'])

  step('build under /demo-kurs/')
  inDemo('npm', ['run', 'build'], { VITE_BASE: `/${DEMO_ID}/` })
  checkBuild(demo, { lab: !opts.noLab })

  if (!opts.skipE2e) {
    step('e2e')
    inDemo('npm', ['run', 'test:e2e'])
  }

  if (!opts.keep) {
    if (custom) rmSync(demo, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    else restoreTracked(demo, emptyDemo(demo))
  }
  console.log('\nintegration ok')
}

export function parseFlags(argv) {
  const flags = { keep: false, noLab: false, skipE2e: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--keep') flags.keep = true
    else if (a === '--no-lab') flags.noLab = true
    else if (a === '--skip-e2e') flags.skipE2e = true
    else if (a === '--dir') {
      const value = argv[++i]
      if (value === undefined || value.startsWith('--')) throw new Error('--dir needs a path')
      flags.dir = value
    } else throw new Error(`unknown option ${a} (use --dir <path>, --keep, --no-lab, --skip-e2e)`)
  }
  return flags
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
  try {
    await run(parseFlags(process.argv.slice(2)))
  } catch (err) {
    console.error(`\nintegration FAILED: ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  }
}
