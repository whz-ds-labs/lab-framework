import { realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/**
 * Returns every path that must never be committed: .ipynb/.pdf files, anything under a `materials`
 * directory, `docs/superpowers/` and `.env*` files (except `.env.example`).
 */
export function findForbidden(files) {
  return files.filter((file) => {
    const normalized = file.split('\\').join('/')
    if (/\.(ipynb|pdf)$/i.test(normalized)) return true
    const segments = normalized.split('/')
    if (segments.includes('materials')) return true
    if (normalized.startsWith('docs/superpowers/') || normalized.includes('/docs/superpowers/')) return true
    const base = segments[segments.length - 1] ?? ''
    return base.startsWith('.env') && base !== '.env.example'
  })
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
  // -z: NUL-separated and unquoted; without it git escapes non-ASCII names ("Folie\303\244.pdf").
  const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter((line) => line.length > 0)
  const bad = findForbidden(tracked)
  if (bad.length > 0) {
    console.error('Forbidden course material tracked in git:\n' + bad.join('\n'))
    process.exit(1)
  }
  console.log('ok')
}
