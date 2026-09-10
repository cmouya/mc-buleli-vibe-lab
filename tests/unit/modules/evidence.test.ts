import { describe, expect, it } from "vitest"
import {
  DomainError,
  assertEvidenceAllowsCompletion,
  recordQuizEvidence,
} from "../../../src/modules/evidence/index.js"

const NOW = "2026-09-10T12:00:00.000Z"

const PASSING_ANSWERS = [
  { questionIndex: 0, selectedIndex: 1, correct: true },
  { questionIndex: 1, selectedIndex: 1, correct: true },
  { questionIndex: 2, selectedIndex: 0, correct: false },
]

describe("evidence domain", () => {
  it("records a passed quiz attempt", () => {
    const evidence = recordQuizEvidence(
      {
        id: "ev-1",
        stepId: "s1",
        score: 2,
        maxScore: 3,
        passed: true,
        answers: PASSING_ANSWERS,
      },
      { now: NOW },
    )

    expect(evidence).toEqual({
      id: "ev-1",
      stepId: "s1",
      type: "quiz_attempt",
      score: 2,
      maxScore: 3,
      passed: true,
      answers: PASSING_ANSWERS,
      recordedAt: NOW,
    })
  })

  it("records a failed quiz attempt without allowing completion", () => {
    const evidence = recordQuizEvidence(
      {
        stepId: "s1",
        score: 0,
        maxScore: 3,
        passed: false,
        answers: [
          { questionIndex: 0, selectedIndex: 0, correct: false },
          { questionIndex: 1, selectedIndex: 0, correct: false },
          { questionIndex: 2, selectedIndex: 0, correct: false },
        ],
      },
      { now: NOW },
    )

    expect(evidence.passed).toBe(false)
    expect(() => assertEvidenceAllowsCompletion(evidence, "s1")).toThrow(DomainError)
  })

  it("allows completion only for passed evidence on the same step (I-05)", () => {
    const passed = recordQuizEvidence(
      {
        stepId: "s1",
        score: 3,
        maxScore: 3,
        passed: true,
        answers: PASSING_ANSWERS,
      },
      { now: NOW },
    )

    expect(() => assertEvidenceAllowsCompletion(passed, "s1")).not.toThrow()
    expect(() => assertEvidenceAllowsCompletion(passed, "s2")).toThrow(DomainError)
  })

  it("rejects empty stepId and invalid scores", () => {
    expect(() =>
      recordQuizEvidence({
        stepId: "  ",
        score: 1,
        maxScore: 3,
        passed: true,
        answers: [],
      }),
    ).toThrow(DomainError)

    expect(() =>
      recordQuizEvidence({
        stepId: "s1",
        score: -1,
        maxScore: 3,
        passed: false,
        answers: [],
      }),
    ).toThrow(DomainError)

    expect(() =>
      recordQuizEvidence({
        stepId: "s1",
        score: 4,
        maxScore: 3,
        passed: true,
        answers: [],
      }),
    ).toThrow(DomainError)
  })

  it("is deterministic for the same inputs and clock", () => {
    const input = {
      stepId: "s1",
      score: 2,
      maxScore: 3,
      passed: true,
      answers: PASSING_ANSWERS,
    }
    const a = recordQuizEvidence(input, { now: NOW })
    const b = recordQuizEvidence(input, { now: NOW })
    expect(a).toEqual(b)
  })
})
