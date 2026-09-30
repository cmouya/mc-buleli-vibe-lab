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
    await expect(page.getByTestId("demo-notice")).toContainText("Résultats de quiz calculés dans le navigateur")
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
    await page.getByRole("button", { name: "Vérifier mon objectif" }).click()
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

    await expect(page.getByTestId("demo-notice")).toContainText("Quiz results calculated in the browser")
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

  for (const [lang, submitLabel, loadingLabel, noticeText] of [
    ["FR", "Vérifier mon objectif", "Préparation du récapitulatif…",
      "Démonstration locale · Parcours préparés à partir de modèles · Résultats de quiz calculés dans le navigateur."],
    ["EN", "Review my goal", "Preparing your summary…",
      "Local demo · Paths built from prepared templates · Quiz results calculated in the browser."],
  ]) {
    test(`demo disclosure persists throughout Goal preparation in ${lang}`, async ({ page }) => {
      await page.goto("/#/goal")
      await page.getByRole("button", { name: lang, exact: true }).click()
      await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") })
      await page.clock.pauseAt(new Date("2026-01-01T00:00:01Z"))
      const notice = page.getByTestId("demo-notice")
      await expect(notice).toHaveCount(1)
      await expect(notice).toBeVisible()
      await expect(notice).toHaveText(noticeText)
      await page.locator("#goal").fill("Piloter Outlook avec l'IA")
      await page.getByRole("button", { name: submitLabel }).click()

      await expect(page.getByRole("heading", { name: loadingLabel, exact: true })).toBeVisible()
      await expect(page.getByTestId("goal-confirmation")).toHaveCount(0)
      await expect(notice).toHaveCount(1)
      await expect(notice).toBeVisible()
      await expect(notice).toHaveText(noticeText)

      await page.clock.runFor(1600)
      await expect(page.getByTestId("goal-confirmation")).toBeVisible()
      await expect(notice).toHaveCount(1)
      await expect(notice).toBeVisible()
      await expect(notice).toHaveText(noticeText)
    })
  }

})
