// End-to-end check of the framework as a course repo would use it: pack, scaffold, install, lint, type-check, test, build, e2e.
//   node scripts/integration.mjs [--keep] [--no-lab] [--skip-e2e]
//   --keep       keep examples/demo-kurs after a successful run (default: empty it again; a failed run always keeps it)
//   --no-lab     only the empty course, no ausgleichsgerade lab
//   --skip-e2e   skip the Playwright run
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scaffold } from '../plugin/scripts/scaffold.mjs'
import { packAll, repoRoot, shOrThrow } from './pack.mjs'

const DEMO_ID = 'demo-kurs'
const KEEP_FILES = ['.gitkeep', 'README.md']

function step(label) {
  console.log(`\n=== ${label} ===`)
}

/** Empties the demo folder except the two tracked files and returns their contents so they can be restored. */
function emptyDemo(demo) {
  mkdirSync(demo, { recursive: true })
  const saved = {}
  for (const f of KEEP_FILES) {
    const p = join(demo, f)
    if (existsSync(p)) saved[f] = readFileSync(p)
  }
  for (const entry of readdirSync(demo)) rmSync(join(demo, entry), { recursive: true, force: true })
  return saved
}

function restoreTracked(demo, saved) {
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
 * @param {{ keep?: boolean; noLab?: boolean; skipE2e?: boolean }} opts
 * @returns {Promise<void>} rejects with the failing command named in the message
 */
export async function run(opts = {}) {
  const demo = resolve(repoRoot, 'examples', DEMO_ID)
  const inDemo = (command, args, env = {}) => {
    console.log(`\n> ${[command, ...args].join(' ')}`)
    shOrThrow(command, args, { cwd: demo, env })
  }

  step('pack framework')
  const packsDir = '.local-packs'
  // pack first: a build failure must not touch an existing demo.
  await packAll(packsDir)

  step('scaffold course')
  const saved = emptyDemo(demo)
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
  if (!opts.noLab) {
    step('scaffold lab')
    scaffold('lab', { dir: demo, topic: 'ausgleichsgerade', titleDe: 'Ausgleichsgerade', titleEn: 'Least squares line' })
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
    const restored = emptyDemo(demo)
    restoreTracked(demo, restored)
  }
  console.log('\nintegration ok')
}

function parseFlags(argv) {
  const known = new Set(['--keep', '--no-lab', '--skip-e2e'])
  for (const a of argv) if (!known.has(a)) throw new Error(`unknown option ${a} (use --keep, --no-lab, --skip-e2e)`)
  return { keep: argv.includes('--keep'), noLab: argv.includes('--no-lab'), skipE2e: argv.includes('--skip-e2e') }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    await run(parseFlags(process.argv.slice(2)))
  } catch (err) {
    console.error(`\nintegration FAILED: ${err instanceof Error ? err.message : String(err)}`)
    process.exitCode = 1
  }
}
