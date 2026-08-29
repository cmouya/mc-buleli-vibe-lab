import { describe, expect, it } from "vitest"
import {
  DEFAULT_PASS_SCORE,
  evaluateQuizSubmission,
  normalizeQuizQuestions,
} from "../../src/shared/assessment.js"

const QUESTIONS = [
  { question: "Q1", options: ["A", "B", "C"], answer: 1, explanation: "E1" },
  { question: "Q2", options: ["A", "B", "C"], answer: 1, explanation: "E2" },
  { question: "Q3", options: ["A", "B", "C"], answer: 1, explanation: "E3" },
]

describe("assessment — evaluateQuizSubmission", () => {
  it("passes when score meets threshold (2/3)", () => {
    const result = evaluateQuizSubmission(QUESTIONS, [1, 1, 0], 2)
    expect(result.score).toBe(2)
    expect(result.passed).toBe(true)
    expect(result.unanswered).toBe(false)
  })

  it("fails when score is below threshold", () => {
    const result = evaluateQuizSubmission(QUESTIONS, [0, 0, 0], 2)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it("fails when answers are unanswered", () => {
    const result = evaluateQuizSubmission(QUESTIONS, [1, -1, 1], 2)
    expect(result.unanswered).toBe(true)
    expect(result.passed).toBe(false)
  })

  it("uses default pass score of 2", () => {
    expect(DEFAULT_PASS_SCORE).toBe(2)
    const pass = evaluateQuizSubmission(QUESTIONS, [1, 1, 0])
    const fail = evaluateQuizSubmission(QUESTIONS, [1, 0, 0])
    expect(pass.passed).toBe(true)
    expect(fail.passed).toBe(false)
  })
})

describe("assessment — normalizeQuizQuestions", () => {
  it("returns multi-question quiz format", () => {
    const lesson = {
      quiz: {
        passScore: 2,
        questions: QUESTIONS,
      },
    }
    expect(normalizeQuizQuestions(lesson)).toHaveLength(3)
  })

  it("normalizes legacy single-question quiz", () => {
    const lesson = {
      quiz: {
        question: "Legacy?",
        options: ["X", "Y"],
        answer: 0,
        explanation: "Because",
      },
    }
    const normalized = normalizeQuizQuestions(lesson)
    expect(normalized).toHaveLength(1)
    expect(normalized[0].question).toBe("Legacy?")
  })

  it("returns empty array when no quiz", () => {
    expect(normalizeQuizQuestions({})).toEqual([])
  })
})
