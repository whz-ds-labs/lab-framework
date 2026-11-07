import { mkdirSync } from 'node:fs'
import { test } from '@playwright/test'
import { collectRoutes, expectVerifyState } from '@whz-ds-labs/lab-kit/testing/e2e'

// Screenshots of every route for visual review: DESIGN_SHOTS=1 npm run test:e2e
test.skip(process.env.DESIGN_SHOTS !== '1', 'set DESIGN_SHOTS=1 to take design screenshots')

test('screenshot every route at 1280 and 375 px', async ({ page }) => {
  mkdirSync('design-shots', { recursive: true })
  await page.setViewportSize({ width: 1280, height: 800 })
  const routes = await collectRoutes(page)
  for (const [index, route] of routes.entries()) {
    const slug = route.split('#')[1]?.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('about:blank')
      await page.goto(route)
      await expectVerifyState(page, 'lab-shell', 'ready')
      await page.screenshot({
        path: `design-shots/${String(index).padStart(2, '0')}-${slug}-${width}.png`,
        fullPage: true,
      })
    }
  }
})
