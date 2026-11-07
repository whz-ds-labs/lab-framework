import { describe, expect, it } from 'vitest'
import { countCopies, evaluateListing, pinMismatches, tarballVersion } from '../scripts/link-local.mjs'

describe('countCopies', () => {
  const names = ['vue', '@whz-ds-labs/lab-kit']
  it('counts distinct installed paths and ignores duplicates in the listing', () => {
    const out = [
      'C:\\c',
      'C:\\c\\node_modules\\vue',
      'C:\\c\\node_modules\\vue',
      'C:\\c\\node_modules\\@whz-ds-labs\\lab-kit',
      'C:\\c\\node_modules\\@whz-ds-labs\\ui',
    ].join('\r\n')
    expect(countCopies(out, names)).toEqual({ vue: 1, '@whz-ds-labs/lab-kit': 1 })
  })
  it('reports a second nested copy', () => {
    const out = '/c/node_modules/vue\n/c/node_modules/@whz-ds-labs/ui/node_modules/vue\n'
    expect(countCopies(out, names)).toEqual({ vue: 2, '@whz-ds-labs/lab-kit': 0 })
  })
})

describe('evaluateListing', () => {
  const names = ['vue', '@whz-ds-labs/lab-kit']
  const paths = '/c\n/c/node_modules/vue\n/c/node_modules/@whz-ds-labs/lab-kit\n'

  it('accepts a non-zero exit when paths were printed (npm marks a pin mismatch invalid)', () => {
    expect(evaluateListing({ status: 1, stdout: paths }, names)).toEqual({ fatal: null, duplicates: [], nonZeroExit: true })
  })

  it('accepts a clean exit', () => {
    expect(evaluateListing({ status: 0, stdout: paths }, names)).toEqual({ fatal: null, duplicates: [], nonZeroExit: false })
  })

  it('is fatal on a spawn error', () => {
    const r = evaluateListing({ error: new Error('spawn ENOENT'), status: null, stdout: paths }, names)
    expect(r.fatal).toContain('spawn ENOENT')
  })

  it('is fatal on empty output, whatever the exit code', () => {
    expect(evaluateListing({ status: 0, stdout: '' }, names).fatal).toContain('no paths')
    expect(evaluateListing({ status: 1, stdout: ' \n' }, names).fatal).toContain('exit code 1')
    expect(evaluateListing({ status: 1, stdout: null }, names).fatal).not.toBeNull()
  })

  it('still reports duplicate copies, also with a non-zero exit', () => {
    const out = `${paths}/c/node_modules/@whz-ds-labs/ui/node_modules/vue\n`
    expect(evaluateListing({ status: 1, stdout: out }, names)).toEqual({
      fatal: null,
      duplicates: [['vue', 2]],
      nonZeroExit: true,
    })
  })
})

describe('tarballVersion', () => {
  it('reads the version from tarball paths of both path styles', () => {
    expect(tarballVersion('C:\fw\.local-packs\whz-ds-labs-ui-0.1.0.tgz')).toBe('0.1.0')
    expect(tarballVersion('/fw/.local-packs/whz-ds-labs-lab-kit-1.2.3-rc.1.tgz')).toBe('1.2.3-rc.1')
    expect(tarballVersion('/fw/other.tgz')).toBeNull()
  })
})

describe('pinMismatches', () => {
  const linked = { '@whz-ds-labs/ui': '0.1.0', '@whz-ds-labs/lab-kit': '0.1.0' }

  it('reports packages pinned to another version', () => {
    const pkg = { dependencies: { '@whz-ds-labs/ui': '0.0.0', '@whz-ds-labs/lab-kit': '0.1.0' } }
    expect(pinMismatches(pkg, linked)).toEqual([{ name: '@whz-ds-labs/ui', pinned: '0.0.0', linked: '0.1.0' }])
  })

  it('reports nothing when pins match, are absent or the tarball version is unknown', () => {
    expect(pinMismatches({ dependencies: { '@whz-ds-labs/ui': '0.1.0' } }, linked)).toEqual([])
    expect(pinMismatches({}, linked)).toEqual([])
    expect(pinMismatches({ devDependencies: { '@whz-ds-labs/ui': '9.9.9' } }, { '@whz-ds-labs/ui': null })).toEqual([])
  })
})
