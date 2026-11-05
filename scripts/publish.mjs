// Idempotent release step, run by CI after `changesets/action` found no pending changesets.
//   node scripts/publish.mjs
// Publishes @whz-ds-labs/lab-kit, then @whz-ds-labs/ui (npm Trusted Publishing, provenance),
// then creates and pushes the tag v<version> if it exists neither locally nor on origin.
// Safe to re-run: published versions and existing tags are skipped. Any registry error other
// than "not found" aborts without publishing.
import { spawnSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Publish order matters: ui depends on lab-kit with the exact same version.
export const packages = [
  { name: '@whz-ds-labs/lab-kit', dir: 'lab-kit' },
  { name: '@whz-ds-labs/ui', dir: 'ui' },
]

/** Classify the result of `npm view <name>@<version> version --json`. */
export function classifyViewResult(exitCode, stdout) {
  let parsed
  try {
    parsed = JSON.parse(String(stdout).trim())
  } catch {
    return 'error'
  }
  if (exitCode === 0) {
    return typeof parsed === 'string' && parsed !== '' ? 'published' : 'error'
  }
  const code = parsed && typeof parsed === 'object' ? parsed.error?.code : undefined
  return code === 'E404' ? 'missing' : 'error'
}

/**
 * @param {Record<string, string>} versions package name -> version
 * @param {Set<string>} published entries "<name>@<version>"
 * @param {Set<string>} tags existing tags (local or origin)
 */
export function planPublish(versions, published, tags) {
  const publish = packages
    .map((p) => p.name)
    .filter((name) => !published.has(`${name}@${versions[name]}`))
  const version = versions[packages[0].name]
  const tag = `v${version}`
  return { publish, tag: tags.has(tag) ? null : tag }
}

function run(cmd, args, opts = {}) {
  // npm is a .cmd shim on Windows and needs a shell there.
  return spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' && cmd === 'npm', ...opts })
}

function die(message) {
  console.error(`publish: ${message}`)
  process.exit(1)
}

function readVersions() {
  const versions = {}
  for (const p of packages) {
    versions[p.name] = JSON.parse(readFileSync(join(root, 'packages', p.dir, 'package.json'), 'utf8')).version
  }
  const distinct = new Set(Object.values(versions))
  if (distinct.size !== 1) die(`packages do not share one version: ${JSON.stringify(versions)}`)
  return versions
}

function main() {
  const versions = readVersions()
  const version = versions[packages[0].name]

  const published = new Set()
  for (const p of packages) {
    const spec = `${p.name}@${versions[p.name]}`
    const res = run('npm', ['view', spec, 'version', '--json'])
    const kind = classifyViewResult(res.status ?? 1, res.stdout ?? '')
    if (kind === 'error') die(`cannot determine whether ${spec} is published, aborting:\n${res.stdout}${res.stderr}`)
    if (kind === 'published') published.add(spec)
    console.log(`${spec}: ${kind}`)
  }

  const tags = new Set()
  const tag = `v${version}`
  const local = run('git', ['tag', '--list', tag])
  if (local.status !== 0) die(`git tag --list failed:\n${local.stderr}`)
  if (local.stdout.trim() === tag) tags.add(tag)
  const remote = run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])
  if (remote.status !== 0) die(`git ls-remote failed:\n${remote.stderr}`)
  if (remote.stdout.trim() !== '') tags.add(tag)

  const plan = planPublish(versions, published, tags)

  for (const name of plan.publish) {
    const dir = packages.find((p) => p.name === name).dir
    console.log(`publishing ${name}@${versions[name]}`)
    const res = run('npm', ['publish', '-w', `packages/${dir}`, '--access', 'public', '--provenance'], { stdio: 'inherit' })
    if (res.status !== 0) die(`npm publish failed for ${name}`)
  }

  if (plan.tag) {
    // Reuse a local tag if only origin lacks it; otherwise create it.
    if (!local.stdout.trim()) {
      const t = run('git', ['tag', '-a', plan.tag, '-m', `Release ${plan.tag}`])
      if (t.status !== 0) die(`git tag failed:\n${t.stderr}`)
    }
    const push = run('git', ['push', 'origin', `refs/tags/${plan.tag}`], { stdio: 'inherit' })
    if (push.status !== 0) die(`git push of ${plan.tag} failed`)
    console.log(`tagged ${plan.tag}`)
  }

  if (plan.publish.length === 0 && !plan.tag) console.log('nothing to do')
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main()
