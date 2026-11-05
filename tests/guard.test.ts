import { describe, expect, it } from 'vitest'
// @ts-expect-error plain .mjs script without type declarations
import { findForbidden } from '../scripts/check-no-materials.mjs'

describe('findForbidden', () => {
  it('flags notebooks, pdfs and materials directories', () => {
    expect(findForbidden(['a/b.ipynb', 'x/Slides.PDF', 'materials/x.csv', 'labs/a/materials/y.txt'])).toHaveLength(4)
  })
  it('allows the single template materials README', () => {
    expect(findForbidden(['plugin/templates/course-intern/materials/README.md'])).toEqual([])
  })
  it('flags docs/superpowers and env files', () => {
    expect(findForbidden(['docs/superpowers/plans/p.md', '.env', 'packages/ui/.env.local'])).toHaveLength(3)
  })
  it('does not flag lookalikes', () => {
    expect(findForbidden(['src/materialsHelper.ts', 'README.md', '.env.example'])).toEqual([])
  })
})
