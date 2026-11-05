import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { classifyViewResult, planPublish } from '../scripts/publish.mjs'

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

  it('treats unparsable output and exit 0 without version as error', () => {
    expect(classifyViewResult(1, 'boom')).toBe('error')
    expect(classifyViewResult(1, '')).toBe('error')
    expect(classifyViewResult(0, '')).toBe('error')
  })
})
