import { expect, test, type Page } from '@playwright/test'
import { expectVerifyState } from '@whz-ds-labs/lab-kit/testing/e2e'

const LAB = '%%topic%%'
const unit = (name: string) => `[data-verify-unit="${name}"]`
const T = { timeout: 10_000 }
const open = async (page: Page, query = 'lang=de') => {
  await page.goto(`/#/${LAB}/line?${query}`)
  await expectVerifyState(page, 'line-fit', 'ready')
}
const card = (page: Page, id: string) => page.locator(`${unit('scenario-bar')} button[data-scenario="${id}"]`)
const note = (page: Page) => page.locator(unit('scenario-note'))
const bootstrap = (page: Page) => page.locator(unit('bootstrap'))
const helpBtn = (page: Page) => page.locator('[data-action="help"]')
const drawer = (page: Page) => page.locator(unit('help'))
const fit = (page: Page) => page.locator(unit('line-fit'))
const nSlider = (page: Page) => page.locator('[data-param="n"] input[type="range"]')

/** Collects console errors and uncaught exceptions of a page. */
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('a slider change updates the URL and the fit', async ({ page }) => {
  const errors = trackErrors(page)
  await open(page)
  await expect(fit(page)).toHaveAttribute('data-verify-count', '20')
  const slope = await page.locator('[data-testid="slope"]').textContent()
  await nSlider(page).fill('40')
  await expect(page).toHaveURL(/n=40/)
  await expect(fit(page)).toHaveAttribute('data-verify-count', '40', T)
  await expect(page.locator(unit('line-plot'))).toHaveAttribute('data-verify-count', '40')
  await expect(page.locator('[data-testid="slope"]')).not.toHaveText(slope ?? '')
  expect(errors).toEqual([])
})

test('keyboard only: the add-point button adds a point, focuses it and the arrow keys move it', async ({ page }) => {
  await open(page)
  const plot = page.locator(unit('line-plot'))
  const add = page.locator('[data-action="add-point"]')
  await add.focus()
  await page.keyboard.press('Enter')
  await expect(plot).toHaveAttribute('data-verify-count', '21', T)
  await expect(page).toHaveURL(/pts=5%3A/)
  const own = page.locator(unit('line-plot') + ' [data-layer="point"][tabindex="0"]')
  await expect(own).toHaveCount(1)
  await expect(own.first()).toBeFocused()
  const before = page.url()
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => page.url()).not.toBe(before)
  await expect(plot).toHaveAttribute('data-verify-count', '21')
})

test('a click on the plot adds a point, reset removes it again', async ({ page }) => {
  const errors = trackErrors(page)
  await open(page)
  const plot = page.locator(unit('line-plot'))
  await expect(plot).toHaveAttribute('data-verify-count', '20')
  await page.locator(`${unit('line-plot')} [data-plot-capture]`).click({ position: { x: 200, y: 60 } })
  await expect(plot).toHaveAttribute('data-verify-count', '21', T)
  await expect(page).toHaveURL(/pts=/)
  await page.locator('[data-action="reset-points"]').click()
  await expect(plot).toHaveAttribute('data-verify-count', '20', T)
  await expect(page).not.toHaveURL(/pts=/)
  expect(errors).toEqual([])
})

test('s1: note, deviation after a change, restore re-applies', async ({ page }) => {
  const errors = trackErrors(page)
  await open(page)
  await card(page, 's1').click()
  await expect(note(page)).toHaveAttribute('data-verify-state', 'ready', T)
  await expect(note(page)).toHaveAttribute('data-verify-scenario', 's1')
  await expect(note(page)).toHaveAttribute('data-verify-deviated', 'false')
  await expect(page).toHaveURL(/scenario=s1/)
  await expect(fit(page)).toHaveAttribute('data-verify-count', '8', T)
  await nSlider(page).fill('30')
  await expect(note(page)).toHaveAttribute('data-verify-deviated', 'true')
  await expect(note(page).locator('[data-action="restore"]')).toBeVisible()
  await expect(fit(page)).toHaveAttribute('data-verify-count', '30', T)
  await note(page).locator('[data-action="restore"]').click()
  await expect(note(page)).toHaveAttribute('data-verify-deviated', 'false')
  await expect(fit(page)).toHaveAttribute('data-verify-count', '8', T)
  await expect(page).toHaveURL(/n=8/)
  expect(errors).toEqual([])
})

test('closing the note moves the focus to the s1 card and drops the scenario from the URL', async ({ page }) => {
  await open(page, 'n=8&noise=3&scenario=s1&lang=de')
  await expect(note(page)).toHaveAttribute('data-verify-state', 'ready', T)
  await note(page).locator('[data-action="close"]').click()
  await expect(note(page)).toHaveAttribute('data-verify-state', 'empty')
  await expect(card(page, 's1')).toBeFocused()
  await expect(page).not.toHaveURL(/scenario=/)
})

test('s2 by link runs the bootstrap exactly once and reaches ready; applying it from the help runs it again', async ({
  page,
}) => {
  const errors = trackErrors(page)
  await page.goto(`/#/${LAB}/line?pts=9%3A-3&scenario=s2&lang=de`)
  await expectVerifyState(page, 'line-fit', 'ready')
  await expect(note(page)).toHaveAttribute('data-verify-scenario', 's2', T)
  await expectVerifyState(page, 'bootstrap', 'ready')
  // data-verify-count of the bootstrap unit is the number of runs started in this view
  await expect(bootstrap(page)).toHaveAttribute('data-verify-count', '1')
  await expect(fit(page)).toHaveAttribute('data-verify-count', '21')
  // a language toggle is an unrelated update: it must not start another run
  await page.locator(unit('lang-toggle')).click()
  await expect(page).toHaveURL(/lang=en/)
  await expect(bootstrap(page)).toHaveAttribute('data-verify-count', '1')
  await expect(bootstrap(page)).toHaveAttribute('data-verify-state', 'ready')

  await helpBtn(page).click()
  await expect(drawer(page)).toHaveAttribute('data-verify-state', 'ready', T)
  await drawer(page).locator('a[data-help-scenario="s2"]').click()
  await expect(bootstrap(page)).toHaveAttribute('data-verify-count', '2', T)
  await expectVerifyState(page, 'bootstrap', 'ready')
  // (a later extra run could only be observed by waiting; the run counter is bumped synchronously at start)
  await expect(bootstrap(page)).toHaveAttribute('data-verify-count', '2')
  expect(errors).toEqual([])
})

test('the bootstrap button runs on demand and a changed point set invalidates the result', async ({ page }) => {
  await open(page)
  await expectVerifyState(page, 'bootstrap', 'empty')
  await page.locator('[data-action="bootstrap"]').click()
  await expectVerifyState(page, 'bootstrap', 'ready')
  await expect(page.locator('[data-testid="ci"]')).toBeVisible()
  await nSlider(page).fill('30')
  await expectVerifyState(page, 'bootstrap', 'empty')
  await expect(page.locator('[data-testid="ci"]')).toHaveCount(0)
})

test('a failing background computation shows the bootstrap error contract', async ({ page }) => {
  await page.route('**/*worker*.js', (route) => route.abort())
  await open(page)
  await page.locator('[data-action="bootstrap"]').click()
  await expectVerifyState(page, 'bootstrap', 'error')
  await expect(bootstrap(page)).toHaveAttribute('data-verify-error', /.+/)
  await expect(page.locator(unit('bootstrap') + ' [role="alert"]')).toBeVisible()
})

test('help drawer: Escape closes it and returns the focus to the button', async ({ page }) => {
  await open(page)
  await helpBtn(page).click()
  await expect(drawer(page)).toHaveAttribute('data-verify-state', 'ready', T)
  await expect(drawer(page).locator('[data-help="read"] li')).toHaveCount(3)
  await expect(drawer(page).locator('[data-help="controls"] li')).toHaveCount(5)
  await page.keyboard.press('Escape')
  await expect(drawer(page)).toHaveAttribute('data-verify-state', 'empty')
  await expect(helpBtn(page)).toBeFocused()
})

test('at 375 px the help drawer is modal', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await open(page)
  await helpBtn(page).click()
  await expect(drawer(page)).toHaveAttribute('data-verify-state', 'ready', T)
  await expect(drawer(page)).toHaveAttribute('role', 'dialog')
  await expect(drawer(page)).toHaveAttribute('aria-modal', 'true')
  expect(await page.locator('main').evaluate((el) => el.hasAttribute('inert'))).toBe(true)
  const box = (await drawer(page).boundingBox())!
  expect(box.width).toBe(375)
  await drawer(page).locator('[data-action="help-close"]').click()
  await expect(drawer(page)).toHaveAttribute('data-verify-state', 'empty')
  expect(await page.locator('main').evaluate((el) => el.hasAttribute('inert'))).toBe(false)
})

test('the language toggle switches shell and tool texts and keeps lang=en in the URL', async ({ page }) => {
  await open(page, 'lang=de')
  const slopeLabel = page.locator('dl.result dt').first()
  await expect(slopeLabel).toHaveText('Steigung')
  await expect(helpBtn(page)).toContainText('Hilfe')
  await page.locator(unit('lang-toggle')).click()
  await expect(slopeLabel).toHaveText('Slope')
  await expect(helpBtn(page)).toContainText('Help')
  await expect(card(page, 's1')).toContainText('Few, very noisy points')
  await expect(page).toHaveURL(/lang=en/)
  await nSlider(page).fill('25')
  await expect(page).toHaveURL(/n=25/)
  await expect(page).toHaveURL(/lang=en/)
  await expect(slopeLabel).toHaveText('Slope')
})

test('an invalid value in the address shows the URL notice and falls back to n = 20', async ({ page }) => {
  await page.goto(`/#/${LAB}/line?n=abc&lang=de`)
  await expectVerifyState(page, 'line-fit', 'ready')
  await expect(page.locator(unit('url-notice'))).toHaveAttribute('data-verify-count', '1')
  await expect(fit(page)).toHaveAttribute('data-verify-count', '20')
  await expect(page.locator('[data-param="n"] output')).toHaveText('20')
})
