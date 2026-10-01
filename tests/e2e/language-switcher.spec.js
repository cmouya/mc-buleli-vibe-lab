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
    ["FR", "Vérifier mon objectif", "Préparation de votre objectif…",
      "Démonstration locale · Parcours préparés à partir de modèles · Résultats de quiz calculés dans le navigateur."],
    ["EN", "Review my goal", "Preparing your goal…",
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

test("transient Goal draft and validation survive FR/EN but not departure", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto("/#/goal"); await page.reload()
  const before = await page.evaluate(() => localStorage.getItem("learnova-learner"))
  await page.locator("#goal").fill("  Outlook draft  ")
  await page.locator('label:has(input[name="level"][value="avance"])').click()
  await page.locator('label:has(input[name="hours"][value="10"])').click()
  for (const lang of ["EN", "FR"]) {
    await page.getByRole("button", { name: lang, exact: true }).click()
    await expect(page.getByRole("button", { name: lang, exact: true })).toBeFocused()
    await expect(page.locator("#goal")).toHaveValue("  Outlook draft  ")
    await expect(page.locator('input[name="level"][value="avance"]')).toBeChecked()
    await expect(page.locator('input[name="hours"][value="10"]')).toBeChecked()
  }
  for (const value of ["", "   "]) {
    await page.locator("#goal").fill(value)
    await page.locator('#goal-form button[type="submit"]').click()
    for (const [lang, error] of [["EN", "Enter a goal before continuing."], ["FR", "Indiquez un objectif avant de continuer."]]) {
      await page.getByRole("button", { name: lang, exact: true }).click()
      await expect(page.locator("#goal")).toHaveValue(value)
      await expect(page.locator("#goal")).toHaveAttribute("aria-invalid", "true")
      await expect(page.locator("#goal")).toHaveAccessibleDescription(error)
    }
  }
  await page.locator("#goal").fill("Corrected")
  await expect(page.locator("#form-error")).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem("learnova-learner"))).toBe(before)
  await page.locator('nav a[href="#/"]').click()
  await page.locator('nav a[href="#/goal"]').click()
  await expect(page.locator("#goal")).toHaveValue("")
  await page.locator("#goal").fill("reload draft"); await page.reload()
  await expect(page.locator("#goal")).toHaveValue("")
})

test("transient quiz draft, errors, results and retry survive FR/EN without duplicate Evidence", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto("/#/goal"); await page.reload()
  await page.locator("#goal").fill("Piloter Outlook avec l'IA")
  await page.locator('#goal-form button[type="submit"]').click()
  await page.getByRole("link", { name: "Construire mon parcours", exact: true }).click()
  await page.getByRole("link", { name: "Commencer mon parcours" }).click()
  await page.getByRole("link", { name: "Continuer mon parcours" }).click()
  const stored = () => page.evaluate(() => localStorage.getItem("learnova-learner"))
  await expect(page.getByTestId("quiz-submit")).toBeVisible()
  const title = await page.locator("main h1").textContent()
  const radio = (q, a) => page.locator(`input[name="q${q}"][value="${a}"]`)
  const switchTo = async lang => {
    const before = await stored()
    await page.getByRole("button", { name: lang, exact: true }).click()
    await expect(page.getByRole("button", { name: lang, exact: true })).toBeFocused()
    await expect(page.locator("main h1")).toHaveText(title)
    await expect(page.getByTestId("demo-notice")).toBeVisible()
    expect(await stored()).toBe(before)
  }
  await switchTo("EN")
  await expect(page.locator("#quiz-form input:checked")).toHaveCount(0)
  await radio(0, 0).check(); await switchTo("FR")
  await expect(radio(0, 0)).toBeChecked()
  await page.getByTestId("quiz-submit").click(); await switchTo("EN")
  await expect(radio(0, 0)).toBeChecked()
  await expect(radio(1, 0)).toHaveAccessibleDescription("Choose an answer for question 2.")
  await expect(radio(1, 0)).toHaveAttribute("aria-invalid", "true")
  expect(JSON.parse(await stored()).evidence).toHaveLength(0)
  for (let q = 0; q < 3; q++) await radio(q, 0).check()
  await page.getByTestId("quiz-submit").click()
  for (const [lang, score] of [["FR", "Score : 0/3 — seuil requis : 2/3"], ["EN", "Score: 0/3 — required threshold: 2/3"]]) {
    await switchTo(lang)
    await expect(page.locator("#quiz-result-score")).toHaveText(score)
    await expect(page.locator("#retry-quiz")).toBeVisible()
  }
  expect(JSON.parse(await stored()).evidence).toHaveLength(1)
  expect(JSON.parse(await stored()).steps.filter(s => s.status === "done")).toHaveLength(0)
  await page.locator("#retry-quiz").click()
  await expect(radio(0, 0)).toBeFocused()
  await expect(page.locator("#quiz-form input:checked")).toHaveCount(0)
  await expect(page.locator("#quiz-form [aria-invalid]")).toHaveCount(0)
  await radio(0, 1).check(); await switchTo("FR")
  await expect(radio(0, 1)).toBeChecked()
  for (let q = 1; q < 3; q++) await radio(q, 1).check()
  await page.getByTestId("quiz-submit").click()
  for (const [lang, label] of [["EN", "Step validated"], ["FR", "Étape validée"]]) {
    await switchTo(lang)
    await expect(page.locator("#quiz-result-heading")).toHaveText(label)
    await expect(page.locator("#quiz-result-score")).toContainText("3/3")
  }
  const state = JSON.parse(await stored())
  expect(state.evidence).toHaveLength(2)
  expect(state.steps[0].status).toBe("done")
  expect(state.steps[1].status).toBe("current")
  expect(Math.round(state.steps.filter(s => s.status === "done").length / state.steps.length * 100)).toBe(17)
  await page.locator("#continue-btn").click()
  await expect(page.getByTestId("progress-label")).toContainText("17 %")
  await page.locator('nav a[href="#/lesson"]').click()
  await expect(page.locator("main h1")).not.toHaveText(title)
  await expect(page.locator("#quiz-result-heading")).toHaveCount(0)
  await radio(0, 0).check()
  await page.locator('nav a[href="#/dashboard"]').click()
  await page.locator('nav a[href="#/lesson"]').click()
  await expect(page.locator("#quiz-form input:checked")).toHaveCount(0)
})
