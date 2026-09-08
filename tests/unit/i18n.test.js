import { beforeEach, describe, expect, it } from "vitest"
import { getLanguage, loadLanguage, setLanguage, t, UI_LANG_KEY } from "../../src/i18n/index.js"
import { renderLanding } from "../../src/views/landing.js"
import { renderLesson } from "../../src/views/lesson.js"
import {
  confirmCurrentGoal,
  getState,
  loadState,
  resetLearner,
  setAnalyzed,
  setPath,
  setProfile,
} from "../../src/store.js"

const OUTLOOK_STEP = {
  id: "outlook-1",
  title: "Comprendre les usages de l'IA dans la gestion des e-mails",
  description: "Poser le cadre IA / Outlook.",
  level: "Débutant",
  duration: "45 min",
  skill: "Usages IA e-mail",
}

describe("i18n — prototype language switcher", () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    resetLearner()
    loadState()
    setLanguage("fr")
  })

  it("defaults to French", () => {
    sessionStorage.removeItem(UI_LANG_KEY)
    expect(loadLanguage()).toBe("fr")
    expect(getLanguage()).toBe("fr")
    expect(t("nav.home")).toBe("Accueil")
    expect(t("landing.ctaBuild")).toBe("Construire mon parcours")
    expect(document.documentElement.lang).toBe("fr")
  })

  it("switching to EN changes visible labels", () => {
    expect(renderLanding()).toContain("Construire mon parcours")
    setLanguage("en")
    expect(getLanguage()).toBe("en")
    expect(t("nav.home")).toBe("Home")
    expect(t("landing.ctaBuild")).toBe("Build my path")
    expect(renderLanding()).toContain("Build my path")
    expect(renderLanding()).not.toContain("Construire mon parcours")
    expect(document.documentElement.lang).toBe("en")
    expect(sessionStorage.getItem(UI_LANG_KEY)).toBe("en")
  })

  it("switching language does not alter learner state or path state", () => {
    setProfile({
      goal: "Devenir Data Analyst",
      level: "debutant",
      hoursPerWeek: 5,
    })
    const before = structuredClone(getState())
    const storedBefore = localStorage.getItem("learnova-learner")

    setLanguage("en")
    expect(t("nav.goal")).toBe("Goal")

    expect(getState()).toEqual(before)
    expect(localStorage.getItem("learnova-learner")).toBe(storedBefore)
    expect(JSON.parse(storedBefore || "{}")).not.toHaveProperty("lang")
  })

  it("translates Lesson UI chrome to English without translating stored lesson content", () => {
    setProfile({
      goal: "Piloter Outlook avec l'IA",
      level: "debutant",
      hoursPerWeek: 5,
    })
    setAnalyzed(true)
    confirmCurrentGoal()
    setPath({
      pathId: "outlook-email-ia",
      pathTitle: "Pilotage d'un projet IA pour la gestion des e-mails Outlook",
      steps: [{ ...OUTLOOK_STEP }],
    })

    const storedLessonSnippet = "Pour piloter un projet d'optimisation e-mail"
    expect(renderLesson()).toContain("Module d'apprentissage")
    expect(renderLesson()).toContain("Concepts clés")
    expect(renderLesson()).toContain("Valider mes réponses")
    expect(renderLesson()).toContain(storedLessonSnippet)

    setLanguage("en")
    const html = renderLesson()
    expect(html).toContain("Learning module")
    expect(html).toContain("Lesson introduction")
    expect(html).toContain("Key concepts")
    expect(html).toContain("Key idea 1")
    expect(html).toContain("Practical example")
    expect(html).toContain("Key takeaway")
    expect(html).toContain("Validation quiz")
    expect(html).toContain("Submit my answers")
    expect(html).toContain("Quiz item 1")
    expect(html).toContain("Your destination")
    expect(html).not.toContain("Module d'apprentissage")
    expect(html).not.toContain("Concepts clés")
    expect(html).not.toContain("Valider mes réponses")
    expect(html).not.toContain("Exemple pratique")
    expect(html).not.toContain("À retenir")
    expect(html).toContain(storedLessonSnippet)
    expect(html).toContain(OUTLOOK_STEP.title)
    expect(getState().steps[0].status).toBe("current")
  })
})
