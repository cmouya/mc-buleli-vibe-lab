import { beforeEach, describe, expect, it } from "vitest"
import { getLanguage, loadLanguage, setLanguage, t, UI_LANG_KEY } from "../../src/i18n/index.js"
import { renderLanding } from "../../src/views/landing.js"
import { bindLesson, renderLesson, resetLessonState } from "../../src/views/lesson.js"
import {
  confirmCurrentGoal,
  getState,
  loadState,
  resetLearner,
  setAnalyzed,
  setPath,
  setProfile,
} from "../../src/store.js"

import { renderGoal } from "../../src/views/goal.js"
import { renderRoadmap } from "../../src/views/roadmap.js"
import { renderDashboard } from "../../src/views/dashboard.js"

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

  it("resolves the Outlook lesson in English without rewriting stored path content", () => {
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

    const storedBefore = localStorage.getItem("learnova-learner")
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
    expect(html).toContain("To lead an AI-enabled email optimisation project")
    expect(html).toContain("Understand how AI can support email management")
    expect(html).toContain("Human review before sensitive communications are sent.")
    expect(html).not.toContain(storedLessonSnippet)
    expect(html).not.toContain(OUTLOOK_STEP.title)
    expect(getState().steps[0].status).toBe("current")
    expect(localStorage.getItem("learnova-learner")).toBe(storedBefore)
  })
})


describe.each([
  ["fr", "Étape validée", "Parcours terminé", "étape validée", "autodéclaré"],
  ["en", "Step validated", "Path completed", "step validated", "Self-reported"],
])("truthful local journey in %s", (lang, passedLabel, completedLabel, stepLabel, levelLabel) => {
  it("keeps failure at zero and describes success and completion without mastery claims", () => {
    localStorage.clear()
    resetLearner()
    setLanguage(lang)
    expect(renderGoal()).toContain(levelLabel)
    setProfile({ goal: "Outlook", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)
    confirmCurrentGoal()
    setPath({ pathId: "outlook-email-ia", pathTitle: "Outlook", steps: [{ ...OUTLOOK_STEP }] })
    expect(renderGoal()).toContain(levelLabel)
    expect(renderRoadmap().toLowerCase()).toContain(levelLabel.toLowerCase())
    expect(renderDashboard()).toContain(levelLabel)

    const root = document.createElement("div")
    document.body.append(root)
    const mount = () => {
      root.innerHTML = renderLesson()
      bindLesson(root, mount)
    }
    mount()
    const submit = (answer) => {
      root.querySelectorAll(`input[value="${answer}"]`).forEach(input => { input.checked = true })
      root.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      return root.textContent
    }
    const failure = submit(0)
    expect(failure).toContain(t("lesson.notReached"))
    expect(getState().steps[0].status).toBe("current")
    expect(renderDashboard()).toContain(t("roadmap.progressLabel", { percent: 0 }))
    root.querySelector("#retry-quiz").click()
    const success = submit(1)
    expect(success).toContain(passedLabel)
    expect(getState().steps[0].status).toBe("done")
    expect(renderDashboard()).toContain(t("roadmap.progressLabel", { percent: 100 }))
    expect(renderDashboard()).toContain(stepLabel)
    resetLessonState()
    const displayedSkill = lang === "en" ? "AI and email" : "IA et messagerie"
    expect(renderLesson()).toContain(t("lesson.youValidated", { skill: displayedSkill }))
    expect(renderRoadmap()).toContain(completedLabel)
    const screens = [renderLanding(), renderGoal(), renderRoadmap(), renderDashboard(), renderLesson(), failure, success].join(" ")
    expect(screens).not.toMatch(/compétences? acquises?|compétence validée|vous maîtrisez|Objectif atteint|skills? acquired|Skill validated|you master|Goal reached|server-recalculated/i)
    root.remove()
  })
})
