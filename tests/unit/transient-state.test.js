import { afterEach, beforeEach, expect, it, vi } from "vitest"
import * as assessment from "../../src/shared/assessment.js"
import * as store from "../../src/store.js"
import { renderLesson, bindLesson, resetLessonState } from "../../src/views/lesson.js"
import { renderGoal, bindGoal, resetGoalDraft } from "../../src/views/goal.js"
import { setLanguage } from "../../src/i18n/index.js"

let root
function path() {
  store.setProfile({ goal: "Outlook", level: "debutant", hoursPerWeek: 5 })
  store.setAnalyzed(true)
  store.confirmCurrentGoal()
  store.setPath({ pathId: "outlook-email-ia", pathTitle: "Outlook", steps: [
    { id: "outlook-1", title: "First" }, { id: "outlook-2", title: "Second" },
  ] })
}
function mountLesson() { root.innerHTML = renderLesson(); bindLesson(root, mountLesson) }
function mountGoal() { root.innerHTML = renderGoal(); bindGoal(root, mountGoal) }
beforeEach(() => {
  store.resetLearner(); resetLessonState(); resetGoalDraft(); setLanguage("fr")
  root = document.createElement("main"); document.body.append(root)
})
afterEach(() => { root.remove(); resetLessonState(); resetGoalDraft(); vi.restoreAllMocks() })
it("localizes a computed Outlook result without evaluating or submitting again and invalidates reused paths", () => {
  path(); mountLesson()
  const evaluate = vi.spyOn(assessment, "evaluateQuizSubmission")
  const submit = vi.spyOn(store, "submitQuizAttempt")
  root.querySelectorAll('input[value="1"]').forEach(radio => { radio.checked = true })
  root.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }))
  const saved = JSON.stringify(store.getState())
  for (const [lang, title] of [["en", "Understand how AI can support email management"], ["fr", "Comprendre les usages de l'IA dans la gestion des e-mails"]]) {
    setLanguage(lang); mountLesson()
    expect(root.querySelector("h1").textContent).toBe(title)
    expect(root.querySelector("#quiz-result-score").textContent).toContain("3/3")
    expect(JSON.stringify(store.getState())).toBe(saved)
  }
  expect(evaluate).toHaveBeenCalledTimes(1)
  expect(submit).toHaveBeenCalledTimes(1)
  path(); mountLesson()
  expect(root.querySelector("#quiz-results").hidden).toBe(true)
  expect(root.querySelectorAll("input:checked")).toHaveLength(0)
  store.resetLearner(); mountLesson()
  expect(root.querySelector("#quiz-form")).toBeNull()
})
it("discards Goal drafts on learner or path replacement", () => {
  mountGoal()
  const input = root.querySelector("textarea")
  input.value = "unsaved"; input.dispatchEvent(new Event("input", { bubbles: true }))
  setLanguage("en"); mountGoal()
  expect(root.querySelector("textarea").value).toBe("unsaved")
  store.resetLearner(); mountGoal()
  expect(root.querySelector("textarea").value).toBe("")
  store.setProfile({ goal: "Replacement", level: "avance", hoursPerWeek: 10 }); mountGoal()
  expect(root.querySelector("textarea").value).toBe("Replacement")
})
