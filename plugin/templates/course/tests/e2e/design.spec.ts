import { expect, test } from '@playwright/test'
import {
  collectRoutes,
  expectNoA11yViolations,
  expectNoHorizontalOverflow,
  expectVerifyState,
} from '@whz-ds-labs/lab-kit/testing/e2e'

// Every reachable page: no horizontal overflow at 375 px, no WCAG A/AA violations at 1280 px, in both color schemes.
test('every route passes the design checks in light and dark', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  const routes = await collectRoutes(page)
  expect(routes.length).toBeGreaterThan(0)
  for (const scheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: scheme })
    for (const route of routes) {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('about:blank')
      await page.goto(route)
      await expectVerifyState(page, 'lab-shell', 'ready')
      await expectNoA11yViolations(page)
      await expectNoHorizontalOverflow(page, 375)
    }
  }
})
