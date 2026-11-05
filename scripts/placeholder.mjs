// Writes placeholder packages (version 0.0.0) used once to claim the npm names and
// configure Trusted Publishing before the first CI release.
//   node scripts/placeholder.mjs <outDir>
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const outDir = process.argv[2]
if (!outDir) {
  console.error('usage: node scripts/placeholder.mjs <outDir>')
  process.exit(1)
}

const description = 'Placeholder – real releases are published from CI (whz-ds-labs/lab-framework)'
const targets = [
  { dir: 'lab-kit', name: '@whz-ds-labs/lab-kit' },
  { dir: 'ui', name: '@whz-ds-labs/ui' },
]

for (const { dir, name } of targets) {
  const target = join(resolve(outDir), dir)
  mkdirSync(target, { recursive: true })
  const pkg = {
    name,
    version: '0.0.0',
    description,
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/whz-ds-labs/lab-framework.git',
      directory: `packages/${dir}`,
    },
  }
  writeFileSync(join(target, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
  writeFileSync(
    join(target, 'README.md'),
    `# ${name}\n\nPlaceholder (0.0.0) that reserves the package name. Real releases are published from CI: https://github.com/whz-ds-labs/lab-framework\n\nPlatzhalter (0.0.0), der den Paketnamen reserviert. Echte Releases werden aus der CI veröffentlicht.\n`,
  )
}

const base = resolve(outDir)
console.log(`Placeholders written to ${base}\n`)
console.log('Publish them once (Windows PowerShell 5, one command per line, logged in via "npm login"):\n')
for (const { dir } of targets) {
  console.log(`  Set-Location "${join(base, dir)}"`)
  console.log('  npm publish --access public')
}
console.log('\nThen configure Trusted Publishing for each package on npmjs.com:')
console.log('  repository whz-ds-labs/lab-framework, workflow release.yml')
