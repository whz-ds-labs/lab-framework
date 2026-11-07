// Idempotent release step, run by CI after `changesets/action` found no pending changesets.
//   node scripts/publish.mjs
// Publishes @whz-ds-labs/lab-kit, then @whz-ds-labs/ui (npm Trusted Publishing, provenance),
// then pushes the tag v<version> if origin lacks it (creating it locally first if needed).
// Safe to re-run: published versions and existing tags are skipped. Any registry error other
// than "not found" aborts without publishing.
//
// To observe in the first real release run (CI log of release.yml):
//   1. `npm view` classification: both packages print "missing" (or "published" on a re-run),
//      never "error" - i.e. the empty NODE_AUTH_TOKEN from viewEnv() avoids E401 and the E404
//      JSON is recognized (stdout or stderr).
//   2. OIDC publish: `npm publish --provenance` authenticates via Trusted Publishing without
//      NPM_TOKEN (if it fails with an auth error, see the registry-url note in release.yml).
//   3. Tag push: "tagged v<version>" appears and the tag exists on origin afterwards.
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

/**
 * Environment for `npm view` and `npm publish`: setup-node's `registry-url` writes an .npmrc that
 * sends ${NODE_AUTH_TOKEN} (a placeholder in CI). That would make the registry answer E401 even
 * for public reads and would override the OIDC token of Trusted Publishing on publish. An empty
 * value keeps the .npmrc interpolation valid but sends no token.
 */
export function viewEnv(env = process.env) {
  return { ...env, NODE_AUTH_TOKEN: '' }
}

/**
 * Classify the result of `npm view <name>@<version> version --json`.
 * npm may print the JSON to stdout or stderr, so stdout is used if non-empty, otherwise stderr.
 * - An E404 error object means "missing" whatever the exit code (this includes npm's
 *   "No match found for version" for a package that exists without that version).
 * - With exit 0, "published" is a non-empty version string, or (npm 12 prints an array even for an
 *   exact version) an array that contains the requested version.
 * - Everything else is "error": any other error object (E401, ENOTFOUND, ETIMEDOUT, ...), a
 *   non-zero exit with a version, an empty or foreign array, unparsable output. Fail closed:
 *   never publish on an ambiguous answer.
 * @param {number} exitCode
 * @param {string} stdout
 * @param {string} [stderr]
 * @param {string} [version] the exact version that was requested
 */
export function classifyViewResult(exitCode, stdout, stderr = '', version) {
  const text = String(stdout ?? '').trim() || String(stderr ?? '').trim()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return 'error'
  }
  if (exitCode === 0 && typeof parsed === 'string' && parsed !== '') return 'published'
  if (exitCode === 0 && Array.isArray(parsed) && version !== undefined && parsed.includes(version)) return 'published'
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.error?.code === 'E404') return 'missing'
  return 'error'
}

/**
 * @param {Record<string, string>} versions package name -> version
 * @param {Set<string>} published entries "<name>@<version>"
 * @param {Set<string>} tags tags that exist on origin
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
    const res = run('npm', ['view', spec, 'version', '--json'], { env: viewEnv() })
    const kind = classifyViewResult(res.status ?? 1, res.stdout ?? '', res.stderr ?? '', versions[p.name])
    if (kind === 'error') die(`cannot determine whether ${spec} is published, aborting:\n${res.stdout}${res.stderr}`)
    if (kind === 'published') published.add(spec)
    console.log(`${spec}: ${kind}`)
  }

  const tags = new Set()
  const tag = `v${version}`
  const local = run('git', ['tag', '--list', tag])
  if (local.status !== 0) die(`git tag --list failed:\n${local.stderr}`)
  const remote = run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`])
  if (remote.status !== 0) die(`git ls-remote failed:\n${remote.stderr}`)
  if (remote.stdout.trim() !== '') tags.add(tag)

  const plan = planPublish(versions, published, tags)

  for (const name of plan.publish) {
    const dir = packages.find((p) => p.name === name).dir
    console.log(`publishing ${name}@${versions[name]}`)
    // Same blanked env as `npm view`: setup-node's placeholder NODE_AUTH_TOKEN must not override
    // the OIDC token of Trusted Publishing.
    const res = run('npm', ['publish', '-w', `packages/${dir}`, '--access', 'public', '--provenance'], {
      stdio: 'inherit',
      env: viewEnv(),
    })
    if (res.status !== 0) die(`npm publish failed for ${name}`)
  }

  if (plan.tag) {
    // Only origin decides: a tag that exists locally but not on origin is pushed as is.
    if (local.stdout.trim() !== plan.tag) {
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
