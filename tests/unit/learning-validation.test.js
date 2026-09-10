import { describe, expect, it } from "vitest"
import { DomainError } from "../../src/modules/shared/index.js"
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
  submitQuizAttempt,
} from "../../src/store.js"
import { applyQuizAttempt } from "../../src/adapters/store/index.js"

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

    submitQuizAttempt("s1", fail)

    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
    expect(getState().steps[1].status).toBe("todo")
    expect(getState().skills).toHaveLength(0)
    expect(getState().evidence).toHaveLength(1)
    expect(getState().evidence[0].passed).toBe(false)
  })

  it("does not complete step when only one answer is correct (1/3)", () => {
    setupPath()
    const fail = evaluateQuizSubmission(QUESTIONS, [1, 0, 0], 2)
    expect(fail.passed).toBe(false)

    submitQuizAttempt("s1", fail)

    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
    expect(getState().evidence[0].passed).toBe(false)
  })

  it("rejects completeStep without passed evidence (I-05)", () => {
    setupPath()
    const fail = evaluateQuizSubmission(QUESTIONS, [0, 0, 0], 2)
    const failedEvidence = applyQuizAttempt({
      stepId: "s1",
      score: fail.score,
      total: fail.total,
      passed: fail.passed,
      details: fail.details,
    }).evidence

    expect(() => completeStep("s1", failedEvidence)).toThrow(DomainError)
    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
  })
})

describe("learning validation — SCENARIO 2: retry and success (Evidence before Completion)", () => {
  it("completes step only after sufficient evidence on retry", () => {
    setupPath()

    const firstAttempt = evaluateQuizSubmission(QUESTIONS, [0, 0, 0], 2)
    expect(firstAttempt.passed).toBe(false)
    submitQuizAttempt("s1", firstAttempt)
    expect(getProgressPercent()).toBe(0)

    const secondAttempt = evaluateQuizSubmission(QUESTIONS, [1, 1, 1], 2)
    expect(secondAttempt.passed).toBe(true)
    submitQuizAttempt("s1", secondAttempt)

    expect(getProgressPercent()).toBe(50)
    expect(getState().steps[0].status).toBe("done")
    expect(getState().steps[1].status).toBe("current")
    expect(getState().skills).toContain("Skill A")
    expect(getState().evidence).toHaveLength(2)
    expect(getState().evidence[0].passed).toBe(false)
    expect(getState().evidence[1].passed).toBe(true)
  })
})
