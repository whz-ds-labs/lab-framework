/** Playwright helpers for course e2e tests. Needs `@playwright/test` and `@axe-core/playwright` (optional peers). */
import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import type { VerifyState } from '../verify'

/** Waits until `[data-verify-unit="<unit>"]` carries `data-verify-state="<state>"`. */
export async function expectVerifyState(page: Page, unit: string, state: VerifyState, timeout = 15_000): Promise<void> {
  await expect(page.locator(`[data-verify-unit="${unit}"]`).first()).toHaveAttribute('data-verify-state', state, { timeout })
}

/** Sets the viewport width and asserts the document does not scroll horizontally. */
export async function expectNoHorizontalOverflow(page: Page, width = 375): Promise<void> {
  const current = page.viewportSize()
  await page.setViewportSize({ width, height: current?.height ?? 800 })
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, `horizontal overflow at ${width}px: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`).toBeLessThanOrEqual(
    innerWidth,
  )
}

/** Runs axe (WCAG 2.0/2.1 A and AA) and fails with a list of rule ids and targets. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const lines = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
  expect(violations, `a11y violations:\n${lines.join('\n')}`).toEqual([])
}

/** Minimal DOM-free hash comparison: same path segments and same parameters regardless of order. */
function sameHash(a: string, b: string): boolean {
  const parse = (h: string) => {
    const body = h.replace(/^#/, '')
    const q = body.indexOf('?')
    const path = q < 0 ? body : body.slice(0, q)
    const params = new URLSearchParams(q < 0 ? '' : body.slice(q + 1))
    const key = [...params.entries()]
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .sort()
      .join('&')
    return { segments: path.split('/').filter(Boolean).join('/'), key }
  }
  const pa = parse(a)
  const pb = parse(b)
  return pa.segments === pb.segments && pa.key === pb.key
}

/**
 * Breadth-first crawl over same-page `a[href^="#/"]` links, starting at `start` and following links up to
 * `maxDepth` hops. Returns each reachable route once (deduplicated with `sameHash`), as `<start path>#<hash>`.
 */
export async function collectRoutes(page: Page, start = '/#/', maxDepth = 3): Promise<string[]> {
  const cut = start.indexOf('#')
  const prefix = cut < 0 ? start : start.slice(0, cut)
  const startHash = cut < 0 ? '#/' : start.slice(cut)
  await page.goto(start)
  const seen: string[] = [startHash]
  let frontier: string[] = [startHash]
  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: string[] = []
    for (const hash of frontier) {
      await page.evaluate((h) => {
        if (location.hash !== h) location.hash = h
      }, hash)
      await page.waitForLoadState('domcontentloaded')
      const hrefs = await page.locator('a[href^="#/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''))
      for (const href of hrefs) {
        if (href && !seen.some((s) => sameHash(s, href))) {
          seen.push(href)
          next.push(href)
        }
      }
    }
    frontier = next
  }
  return seen.map((h) => `${prefix}${h}`)
}
