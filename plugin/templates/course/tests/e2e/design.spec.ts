import { expect, test } from '@playwright/test'
import {
  collectRoutes,
  expectNoA11yViolations,
  expectNoHorizontalOverflow,
  expectVerifyState,
} from '@whz-ds-labs/lab-kit/testing/e2e'

// Every reachable page: no horizontal overflow at 375 px, no WCAG A/AA violations at 1280 px, in both color schemes.
// All routes are checked even after a failure; the final assertion lists every failing route.
test('every route passes the design checks in light and dark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  const routes = await collectRoutes(page)
  expect(routes.length).toBeGreaterThan(0)
  // The sweep is one test: scale its budget with the number of page checks.
  test.setTimeout(30_000 + routes.length * 2 * 15_000)
  const failures: string[] = []
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    for (const route of routes) {
      try {
        await page.setViewportSize({ width: 1280, height: 800 })
        await page.goto('about:blank')
        await page.goto(route)
        await expectVerifyState(page, 'lab-shell', 'ready')
        await expectNoA11yViolations(page)
        await expectNoHorizontalOverflow(page, 375)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        failures.push(`[${scheme}] ${route}: ${msg.split('\n').slice(0, 4).join(' | ')}`)
      }
    }
  }
  expect(failures, `failing routes:\n${failures.join('\n')}`).toEqual([])
})
