import { describe, expect, it } from "vitest"
import { submitAssessment } from "../../../src/application/submit-assessment.js"

const FAIL_DETAILS = [
  { index: 0, selected: 0, correct: false },
  { index: 1, selected: 0, correct: false },
  { index: 2, selected: 0, correct: false },
]

const PASS_DETAILS = [
  { index: 0, selected: 1, correct: true },
  { index: 1, selected: 1, correct: true },
  { index: 2, selected: 0, correct: false },
]

describe("application — submitAssessment", () => {
  it("records failed evidence and does not allow completion", () => {
    const result = submitAssessment({
      stepId: "s1",
      score: 0,
      total: 3,
      passed: false,
      details: FAIL_DETAILS,
    })

    expect(result.evidence.passed).toBe(false)
    expect(result.completionAllowed).toBe(false)
    expect(result.evidence.stepId).toBe("s1")
  })

  it("records passed evidence and allows completion via I-05 assert", () => {
    const result = submitAssessment({
      stepId: "s1",
      score: 2,
      total: 3,
      passed: true,
      details: PASS_DETAILS,
    })

    expect(result.evidence.passed).toBe(true)
    expect(result.completionAllowed).toBe(true)
    expect(result.evidence.score).toBe(2)
  })

  it("treats fail then pass as two independent attempts", () => {
    const fail = submitAssessment({
      stepId: "s1",
      score: 0,
      total: 3,
      passed: false,
      details: FAIL_DETAILS,
    })
    const pass = submitAssessment({
      stepId: "s1",
      score: 3,
      total: 3,
      passed: true,
      details: PASS_DETAILS,
    })

    expect(fail.completionAllowed).toBe(false)
    expect(pass.completionAllowed).toBe(true)
    expect(fail.evidence.passed).not.toBe(pass.evidence.passed)
  })
})
