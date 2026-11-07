import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CLASS_GLYPHS, CLASS_STYLES, classColor, classColors, classGlyph, classPolygon } from '../src/classStyle'
import { mixGrid, parseHexColor } from '../src/colors'
import { DRAWER_BREAKPOINT } from '../src/viewport'
import { packageRoot } from './helpers/dist'

describe('class style', () => {
  it('has six distinct colours, glyphs and marker shapes', () => {
    expect(CLASS_STYLES).toBe(6)
    expect(new Set(classColors(6)).size).toBe(6)
    expect(new Set(CLASS_GLYPHS).size).toBe(6)
    expect(new Set([2, 3, 4, 5].map((k) => classPolygon(k, 0, 0))).size).toBe(4)
    expect(classColor(7)).toBe(classColor(1))
    expect(classGlyph(0)).toBe('●')
  })

  it('refers to the --ds-class tokens', () => {
    expect(classColor(3)).toBe('var(--ds-class-3)')
    expect(classColors(2)).toEqual(['var(--ds-class-0)', 'var(--ds-class-1)'])
  })

  it('defines --ds-class-0..5 for light and dark mode', () => {
    const css = readFileSync(join(packageRoot, 'tokens.css'), 'utf8')
    const dark = css.slice(css.indexOf('prefers-color-scheme: dark'))
    const light = css.slice(0, css.indexOf('prefers-color-scheme: dark'))
    for (let k = 0; k < 6; k++) {
      expect(light).toMatch(new RegExp(`--ds-class-${k}: #[0-9a-f]{6}`))
      expect(dark).toMatch(new RegExp(`--ds-class-${k}: #[0-9a-f]{6}`))
    }
  })
})

describe('colour helpers', () => {
  it('parses #rgb and #rrggbb, rejects the rest', () => {
    expect(parseHexColor('#fff')).toEqual([255, 255, 255])
    expect(parseHexColor(' #0072b2 ')).toEqual([0, 114, 178])
    expect(parseHexColor('var(--ds-class-0)')).toBeNull()
  })

  it('mixes a grid flipped vertically', () => {
    // 2x2 grid, 2 classes; row 0 (lowest y) is pure class 0, row 1 pure class 1.
    const grid = [1, 0, 1, 0, 0, 1, 0, 1]
    const px = mixGrid(grid, 2, 2, [[255, 0, 0], [0, 0, 255]])
    expect([...px.slice(0, 4)]).toEqual([0, 0, 255, 160])
    expect([...px.slice(8, 12)]).toEqual([255, 0, 0, 160])
  })

  it('exposes the drawer breakpoint', () => {
    expect(DRAWER_BREAKPOINT).toBe(768)
  })
})
