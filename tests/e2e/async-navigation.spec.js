import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => { localStorage.removeItem("learnova-learner"); sessionStorage.removeItem("learnova-ui-lang") })
  await page.goto("/#/goal")
  await page.reload()
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
  await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))
})
async function submit(page) {
  await page.locator("#goal").fill("Piloter Outlook avec l'IA")
  await page.getByRole("button", { name: "Vérifier mon objectif" }).click()
}
async function generate(page) {
  await submit(page)
  await page.clock.runFor(1600)
  await page.getByRole("link", { name: "Construire mon parcours", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Construction de votre itinéraire…" })).toBeVisible()
}
async function state(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("learnova-learner")))
}

test("leaving Goal cancels preparation and returning restores the saved form", async ({ page }) => {
  await submit(page)
  await page.getByRole("link", { name: "Accueil", exact: true }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole("link", { name: "Construire mon parcours", exact: true })).toBeVisible()
  await page.clock.runFor(2000)
  expect((await state(page)).analyzed).toBe(false)
  await page.getByRole("link", { name: "Objectif", exact: true }).click()
  await expect(page.locator("#goal")).toHaveValue("Piloter Outlook avec l'IA")
  await expect(page.getByTestId("goal-confirmation")).toHaveCount(0)
})

test("leaving Roadmap prevents late navigation and writes; returning starts a fresh generation", async ({ page }) => {
  await generate(page)
  await page.getByRole("link", { name: "Accueil", exact: true }).click()
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole("link", { name: "Construire mon parcours", exact: true })).toBeVisible()
  await page.clock.runFor(2000)
  expect((await state(page)).steps).toEqual([])
  await expect(page.getByTestId("roadmap-ready")).toHaveCount(0)
  await expect(page.getByRole("link", { name: "Construire mon parcours", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Itinéraire", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Construction de votre itinéraire…" })).toBeVisible()
  await page.clock.runFor(1400)
  await expect(page.getByTestId("roadmap-ready")).toBeVisible()
  expect((await state(page)).steps).toHaveLength(6)
})

test("language switches during Goal and Roadmap preserve deadlines and the disclosure", async ({ page }) => {
  await submit(page)
  await page.clock.runFor(800)
  await page.getByRole("button", { name: "EN", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Preparing your summary…" })).toBeVisible()
  await expect(page.getByTestId("demo-notice")).toBeVisible()
  await page.clock.runFor(800)
  await expect(page.getByTestId("goal-confirmation")).toBeVisible()
  await page.getByRole("link", { name: "Build my path", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Building your itinerary…" })).toBeVisible()
  await page.clock.runFor(700)
  await page.getByRole("button", { name: "FR", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Construction de votre itinéraire…" })).toBeVisible()
  await expect(page.getByTestId("demo-notice")).toBeVisible()
  await page.clock.runFor(700)
  await expect(page.getByTestId("roadmap-ready")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Votre destination", exact: true })).toBeVisible()
})

test("Roadmap requires explicit confirmation", async ({ page }) => {
  await submit(page)
  await page.clock.runFor(1600)
  await page.getByRole("link", { name: "Itinéraire", exact: true }).click()
  await expect(page).toHaveURL(/#\/goal$/)
  await page.clock.runFor(2000)
  expect((await state(page)).confirmed).toBe(false)
  expect((await state(page)).steps).toEqual([])
  await expect(page.getByTestId("goal-confirmation")).toBeVisible()
})
