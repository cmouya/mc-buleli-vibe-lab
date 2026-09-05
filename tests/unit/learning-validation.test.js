import { describe, expect, it } from "vitest"
import { evaluateQuizSubmission } from "../../src/shared/assessment.js"
import {
  completeStep,
  confirmCurrentGoal,
  getProgressPercent,
  getState,
  loadState,
  resetLearner,
  setAnalyzed,
  setPath,
  setProfile,
} from "../../src/store.js"

const QUESTIONS = [
  { question: "Q1", options: ["A", "B", "C"], answer: 1, explanation: "E1" },
  { question: "Q2", options: ["A", "B", "C"], answer: 1, explanation: "E2" },
  { question: "Q3", options: ["A", "B", "C"], answer: 1, explanation: "E3" },
]

const STEPS = [
  { id: "s1", title: "Step 1", description: "D1", level: "Débutant", duration: "45 min", skill: "Skill A" },
  { id: "s2", title: "Step 2", description: "D2", level: "Débutant", duration: "50 min", skill: "Skill B" },
]

function setupPath() {
  localStorage.clear()
  resetLearner()
  loadState()
  setProfile({ goal: "Test", level: "debutant", hoursPerWeek: 5 })
  setAnalyzed(true)
  confirmCurrentGoal()
  setPath({ pathId: "test", pathTitle: "Test", steps: STEPS.map((s) => ({ ...s })) })
}

describe("learning validation — SCENARIO 1: failed quiz (Attempt ≠ Completion)", () => {
  it("does not complete step when assessment fails", () => {
    setupPath()
    const fail = evaluateQuizSubmission(QUESTIONS, [0, 0, 0], 2)
    expect(fail.passed).toBe(false)

    if (fail.passed) {
      completeStep("s1")
    }

    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
    expect(getState().steps[1].status).toBe("todo")
    expect(getState().skills).toHaveLength(0)
  })

  it("does not complete step when only one answer is correct (1/3)", () => {
    setupPath()
    const fail = evaluateQuizSubmission(QUESTIONS, [1, 0, 0], 2)
    expect(fail.passed).toBe(false)

    if (fail.passed) {
      completeStep("s1")
    }

    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
  })
})

describe("learning validation — SCENARIO 2: retry and success (Evidence before Completion)", () => {
  it("completes step only after sufficient evidence on retry", () => {
    setupPath()

    const firstAttempt = evaluateQuizSubmission(QUESTIONS, [0, 0, 0], 2)
    expect(firstAttempt.passed).toBe(false)
    if (firstAttempt.passed) {
      completeStep("s1")
    }
    expect(getProgressPercent()).toBe(0)

    const secondAttempt = evaluateQuizSubmission(QUESTIONS, [1, 1, 1], 2)
    expect(secondAttempt.passed).toBe(true)
    if (secondAttempt.passed) {
      completeStep("s1")
    }

    expect(getProgressPercent()).toBe(50)
    expect(getState().steps[0].status).toBe("done")
    expect(getState().steps[1].status).toBe("current")
    expect(getState().skills).toContain("Skill A")
  })
})
