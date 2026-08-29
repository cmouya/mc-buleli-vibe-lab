import { expect, test } from "@playwright/test"

const OUTLOOK_GOAL =
  "J'aimerais apprendre à piloter un projet d'optimisation intelligente de la gestion des e-mails Outlook par l'IA pour cadres d'entreprises."

test.describe.configure({ mode: "serial" })

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.removeItem("learnova-learner"))
})

test("TEST-E2E-001: user can open the landing page", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Learnova/)
  await expect(page.getByRole("heading", { name: /apprentissage intelligent/i })).toBeVisible()
  await expect(page.getByRole("link", { name: "Construire mon parcours" })).toBeVisible()
})

test("TEST-E2E-002: user can enter or select a learning goal", async ({ page }) => {
  await page.goto("/#/goal")
  await expect(page.getByRole("heading", { name: /Quel objectif/i })).toBeVisible()

  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()

  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await expect(page.getByTestId("goal-confirmation")).toContainText(OUTLOOK_GOAL)
})

test("TEST-E2E-003: goal analysis leads to a generated roadmap", async ({ page }) => {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })

  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(OUTLOOK_GOAL)).toBeVisible()
  await expect(page.getByText(/Outlook|e-mail/i).first()).toBeVisible()
})

test("TEST-E2E-004: roadmap navigation leads to the learner dashboard", async ({ page }) => {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })

  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await expect(page).toHaveURL(/#\/dashboard/)
  await expect(page.getByRole("heading", { name: "Ma destination" })).toBeVisible()
  await expect(page.getByTestId("progress-label")).toHaveText("Progression : 0 %")
})

test("TEST-E2E-005: user can start the first learning step", async ({ page }) => {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await page.getByRole("link", { name: "Continuer mon parcours" }).click()

  await expect(page).toHaveURL(/#\/lesson/)
  await expect(page.locator(".lesson-header h1")).toContainText(/e-mails/i)
  await expect(page.locator("#quiz-form")).toBeVisible()
  await expect(page.locator(".quiz__block")).toHaveCount(3)
})

test("TEST-E2E-006: user can complete the quiz", async ({ page }) => {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await page.getByRole("link", { name: "Continuer mon parcours" }).click()

  const blocks = page.locator(".quiz__block")
  await expect(blocks).toHaveCount(3)
  for (let i = 0; i < 3; i += 1) {
    await blocks.nth(i).locator('input[value="1"]').check()
  }
  await page.getByRole("button", { name: "Valider mes réponses" }).click()
  await expect(page.getByTestId("quiz-results")).toBeVisible()
})

test("TEST-E2E-007: successful quiz validation marks first step completed", async ({ page }) => {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await page.getByRole("link", { name: "Continuer mon parcours" }).click()

  const blocks = page.locator(".quiz__block")
  for (let i = 0; i < 3; i += 1) {
    await blocks.nth(i).locator('input[value="1"]').check()
  }
  await page.getByRole("button", { name: "Valider mes réponses" }).click()
  await expect(page.getByText("Compétence validée")).toBeVisible()

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("learnova-learner") || "{}"))
  expect(stored.steps[0].status).toBe("done")
  expect(stored.steps[1].status).toBe("current")
})

test("TEST-E2E-008: progression changes from 0%", async ({ page }) => {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await expect(page.getByTestId("progress-label")).toHaveText("Progression : 0 %")

  await page.getByRole("link", { name: "Continuer mon parcours" }).click()
  const blocks = page.locator(".quiz__block")
  for (let i = 0; i < 3; i += 1) {
    await blocks.nth(i).locator('input[value="1"]').check()
  }
  await page.getByRole("button", { name: "Valider mes réponses" }).click()
  await page.getByRole("link", { name: /Continuer vers l'étape 2/i }).click()

  await expect(page).toHaveURL(/#\/dashboard/)
  await expect(page.getByTestId("progress-label")).toHaveText("Progression : 17 %")
  await expect(page.getByText("1 compétence acquise")).toBeVisible()
})
