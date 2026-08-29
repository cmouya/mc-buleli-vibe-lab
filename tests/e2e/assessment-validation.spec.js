import { expect, test } from "@playwright/test"

const OUTLOOK_GOAL =
  "J'aimerais apprendre à piloter un projet d'optimisation intelligente de la gestion des e-mails Outlook par l'IA pour cadres d'entreprises."

async function navigateToLessonQuiz(page) {
  await page.goto("/#/goal")
  await page.locator("#goal").fill(OUTLOOK_GOAL)
  await page.getByRole("button", { name: "Analyser mon objectif" }).click()
  await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
  await page.getByRole("link", { name: "Construire mon parcours" }).click()
  await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await page.getByRole("link", { name: "Continuer mon parcours" }).click()
  await expect(page.locator("#quiz-form")).toBeVisible()
}

async function submitQuizAnswers(page, answerValue) {
  const blocks = page.locator(".quiz__block")
  const count = await blocks.count()
  for (let i = 0; i < count; i += 1) {
    await blocks.nth(i).locator(`input[value="${answerValue}"]`).check()
  }
  await page.getByRole("button", { name: "Valider mes réponses" }).click()
}

test.describe.configure({ mode: "serial" })

test.beforeEach(async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => localStorage.removeItem("learnova-learner"))
})

test("SCENARIO 1 E2E: failed quiz does not validate competency or increase progression", async ({ page }) => {
  await navigateToLessonQuiz(page)

  await submitQuizAnswers(page, "0")

  await expect(page.getByText("Validation non atteinte")).toBeVisible()
  await expect(page.getByText("Compétence validée")).not.toBeVisible()
  await expect(page.getByRole("button", { name: "Réessayer le quiz" })).toBeVisible()

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("learnova-learner") || "{}"))
  expect(stored.steps[0].status).toBe("current")
  expect(stored.steps[1].status).toBe("todo")

  await page.goto("/#/dashboard")
  await expect(page.getByTestId("progress-label")).toHaveText("Progression : 0 %")
})

test("SCENARIO 2 E2E: retry after failure then success validates and increases progression", async ({ page }) => {
  await navigateToLessonQuiz(page)

  await submitQuizAnswers(page, "0")
  await expect(page.getByText("Validation non atteinte")).toBeVisible()
  await page.getByRole("button", { name: "Réessayer le quiz" }).click()

  await expect(page.locator("#quiz-form")).toBeVisible()
  await submitQuizAnswers(page, "1")

  await expect(page.getByText("Compétence validée")).toBeVisible()
  await page.getByRole("link", { name: /Continuer vers l'étape 2/i }).click()

  await expect(page).toHaveURL(/#\/dashboard/)
  await expect(page.getByTestId("progress-label")).toHaveText("Progression : 17 %")

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("learnova-learner") || "{}"))
  expect(stored.steps[0].status).toBe("done")
  expect(stored.steps[1].status).toBe("current")
})
