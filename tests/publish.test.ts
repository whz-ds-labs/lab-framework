import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { classifyViewResult, planPublish, viewEnv } from '../scripts/publish.mjs'

const versions = { '@whz-ds-labs/lab-kit': '0.1.0', '@whz-ds-labs/ui': '0.1.0' }
const both = new Set(['@whz-ds-labs/lab-kit@0.1.0', '@whz-ds-labs/ui@0.1.0'])

describe('planPublish', () => {
  it('publishes lab-kit before ui and tags when nothing exists', () => {
    expect(planPublish(versions, new Set(), new Set())).toEqual({
      publish: ['@whz-ds-labs/lab-kit', '@whz-ds-labs/ui'],
      tag: 'v0.1.0',
    })
  })

  it('only tags when both packages are already published', () => {
    expect(planPublish(versions, both, new Set())).toEqual({ publish: [], tag: 'v0.1.0' })
  })

  it('does nothing when everything is present', () => {
    expect(planPublish(versions, both, new Set(['v0.1.0']))).toEqual({ publish: [], tag: null })
  })

  it('publishes only the missing package', () => {
    const published = new Set(['@whz-ds-labs/lab-kit@0.1.0'])
    expect(planPublish(versions, published, new Set(['v0.1.0']))).toEqual({
      publish: ['@whz-ds-labs/ui'],
      tag: null,
    })
  })
})

describe('classifyViewResult', () => {
  it('treats a version JSON with exit 0 as published', () => {
    expect(classifyViewResult(0, '"0.1.0"\n')).toBe('published')
  })

  it('treats an E404 JSON error as missing', () => {
    const out = JSON.stringify({ error: { code: 'E404', summary: 'Not Found' } })
    expect(classifyViewResult(1, out)).toBe('missing')
  })

  it('treats network errors as error', () => {
    for (const code of ['ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET']) {
      expect(classifyViewResult(1, JSON.stringify({ error: { code } }))).toBe('error')
    }
  })

  it('reads the E404 JSON from stderr when stdout is empty', () => {
    const err = JSON.stringify({ error: { code: 'E404' } })
    expect(classifyViewResult(1, '', err)).toBe('missing')
    expect(classifyViewResult(1, '  \n', err)).toBe('missing')
  })

  it('treats E401 as error (also on stderr)', () => {
    const err = JSON.stringify({ error: { code: 'E401' } })
    expect(classifyViewResult(1, '', err)).toBe('error')
    expect(classifyViewResult(1, err)).toBe('error')
  })

  it('treats an E404 object as missing even with exit 0', () => {
    expect(classifyViewResult(0, JSON.stringify({ error: { code: 'E404' } }))).toBe('missing')
  })

  it('trusts a bare version string only with exit 0', () => {
    expect(classifyViewResult(0, '', '"0.1.0"')).toBe('published')
    expect(classifyViewResult(1, '"0.1.0"')).toBe('error')
    expect(classifyViewResult(0, '""')).toBe('error')
  })

  it('treats unparsable output and exit 0 without version as error', () => {
    expect(classifyViewResult(1, 'boom')).toBe('error')
    expect(classifyViewResult(1, '')).toBe('error')
    expect(classifyViewResult(0, '')).toBe('error')
  })
})

describe('viewEnv', () => {
  it('blanks NODE_AUTH_TOKEN and keeps the rest', () => {
    const env = viewEnv({ NODE_AUTH_TOKEN: 'xxx-placeholder', PATH: '/bin' })
    expect(env.NODE_AUTH_TOKEN).toBe('')
    expect(env.PATH).toBe('/bin')
  })
})
