// Runs the Python golden tests (or regenerates the golden files) of every lab that has a `golden/` folder.
//   node scripts/run-golden.mjs [--make] [--labs a,b]
// Labs without `golden/` are skipped with a message. Without any lab the script prints "no labs" and exits 0.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const make = args.includes('--make')
const li = args.indexOf('--labs')
let labs
if (li >= 0) {
  const raw = args[li + 1] ?? ''
  labs = raw
    .split(/[,\s]+/)
    .map((l) => l.replace(/^labs\//, ''))
    .filter(Boolean)
} else {
  labs = existsSync('labs')
    ? readdirSync('labs', { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : []
}

if (labs.length === 0) {
  console.log('no labs')
  process.exit(0)
}

let failed = 0
for (const lab of labs) {
  const golden = join('labs', lab, 'golden')
  if (!existsSync(golden)) {
    console.log(`skip ${lab}: no golden/ folder`)
    continue
  }
  const tail = make ? ['python', 'make_golden.py'] : ['pytest', '-q']
  const uvArgs = ['run', '--native-tls', '--locked', '--project', '.', ...tail]
  console.log(`${lab}: uv ${uvArgs.join(' ')}`)
  // cwd = the golden folder, so uv finds its pyproject.toml and pytest its configuration.
  const r = spawnSync('uv', uvArgs, { cwd: golden, stdio: 'inherit' })
  if (r.error) {
    console.error(`${lab}: cannot run uv (${r.error.message}); install uv from https://docs.astral.sh/uv/`)
    failed++
  } else if (r.status !== 0) {
    console.error(`${lab}: failed with exit code ${r.status}`)
    failed++
  }
}
process.exit(failed > 0 ? 1 : 0)
