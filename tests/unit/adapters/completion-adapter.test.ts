import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import { applyQuizAttempt, assertCanCompleteStep } from "../../../src/adapters/store/index.js"

const NOW = "2026-09-10T12:00:00.000Z"

const PASS_DETAILS = [
  { index: 0, selected: 1, correct: true },
  { index: 1, selected: 1, correct: true },
  { index: 2, selected: 0, correct: false },
]

describe("completion-adapter", () => {
  it("maps a passing quiz to evidence that allows completion", () => {
    const patch = applyQuizAttempt(
      {
        stepId: "s1",
        score: 2,
        total: 3,
        passed: true,
        details: PASS_DETAILS,
      },
      { now: NOW },
    )

    expect(patch.completionAllowed).toBe(true)
    expect(patch.evidence.passed).toBe(true)
    expect(patch.evidence.stepId).toBe("s1")
    expect(patch.evidence.maxScore).toBe(3)
    expect(patch.evidence.answers).toHaveLength(3)
    expect(() => assertCanCompleteStep(patch.evidence, "s1")).not.toThrow()
  })

  it("maps a failing quiz to evidence that does not allow completion (I-05)", () => {
    const patch = applyQuizAttempt({
      stepId: "s1",
      score: 0,
      total: 3,
      passed: false,
      details: [
        { index: 0, selected: 0, correct: false },
        { index: 1, selected: 0, correct: false },
        { index: 2, selected: 0, correct: false },
      ],
    })

    expect(patch.completionAllowed).toBe(false)
    expect(patch.evidence.passed).toBe(false)
    expect(() => assertCanCompleteStep(patch.evidence, "s1")).toThrow(DomainError)
  })
})
