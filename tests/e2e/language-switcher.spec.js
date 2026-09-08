import { expect, test } from "@playwright/test"

test.describe("language switcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.removeItem("learnova-learner")
      sessionStorage.removeItem("learnova-ui-lang")
    })
    await page.reload()
  })

  test("FR is the default visible language", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Construire mon parcours" })).toBeVisible()
    await expect(page.getByRole("button", { name: "FR" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "false")
    await expect(page.locator("html")).toHaveAttribute("lang", "fr")
  })

  test("switching to EN changes visible labels without altering learner storage", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.setItem(
        "learnova-learner",
        JSON.stringify({
          goal: "Demo goal",
          level: "debutant",
          hoursPerWeek: 5,
          analyzed: true,
          confirmed: true,
          intent: "professionnel",
          pathId: "p1",
          pathTitle: "Path",
          steps: [{ id: "s1", title: "Step 1", status: "current" }],
          skills: [],
          updatedAt: null,
        }),
      )
    })
    const before = await page.evaluate(() => localStorage.getItem("learnova-learner"))

    await page.getByRole("button", { name: "EN" }).click()

    await expect(page.getByRole("link", { name: "Home" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Build my path" })).toBeVisible()
    await expect(page.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")

    const after = await page.evaluate(() => localStorage.getItem("learnova-learner"))
    expect(after).toBe(before)
  })

  test("switching to EN on Lesson re-renders lesson UI chrome", async ({ page }) => {
    const goal =
      "J'aimerais apprendre à piloter un projet d'optimisation intelligente de la gestion des e-mails Outlook par l'IA pour cadres d'entreprises."
    await page.goto("/#/goal")
    await page.locator("#goal").fill(goal)
    await page.getByRole("button", { name: "Analyser mon objectif" }).click()
    await expect(page.getByTestId("goal-confirmation")).toBeVisible({ timeout: 5000 })
    await page.getByRole("link", { name: "Construire mon parcours" }).click()
    await expect(page.getByTestId("roadmap-ready")).toBeVisible({ timeout: 10000 })
    await page.getByRole("link", { name: "Commencer mon parcours" }).click()
    await page.getByRole("link", { name: "Continuer mon parcours" }).click()

    await expect(page.getByTestId("quiz-submit")).toHaveText("Valider mes réponses")
    await expect(page.getByTestId("lesson-eyebrow")).toHaveText("Module d'apprentissage")
    await expect(page.getByRole("heading", { name: "Concepts clés" })).toBeVisible()

    const storedBefore = await page.evaluate(() => localStorage.getItem("learnova-learner"))
    await page.getByRole("button", { name: "EN" }).click()

    await expect(page.getByTestId("quiz-submit")).toHaveText("Submit my answers")
    await expect(page.getByTestId("lesson-eyebrow")).toHaveText("Learning module")
    await expect(page.getByRole("heading", { name: "Key concepts" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Lesson introduction" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Practical example" })).toBeVisible()
    await expect(page.getByText("Key idea 1")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Concepts clés" })).toHaveCount(0)
    await expect(page.locator(".lesson__body")).toContainText("e-mail")

    const storedAfter = await page.evaluate(() => localStorage.getItem("learnova-learner"))
    expect(storedAfter).toBe(storedBefore)
  })
})
