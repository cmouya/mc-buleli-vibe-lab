import { describe, expect, it } from "vitest"
import { DomainError, scoreOwnedQuiz } from "../../../src/modules/evidence/index.js"
import type { OwnedQuizDefinition, QuizSelection } from "../../../src/modules/evidence/index.js"

const THREE_ITEM_QUIZ: OwnedQuizDefinition = {
  minimumCorrectCount: 2,
  items: [
    { options: ["a", "b", "c"], correctIndex: 1 },
    { options: ["a", "b"], correctIndex: 0 },
    { options: ["a", "b", "c", "d"], correctIndex: 2 },
  ],
}

function selection(questionIndex: number, selectedIndex: number): QuizSelection {
  return { questionIndex, selectedIndex }
}

function expectCode(run: () => void, code: string): void {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError)
    expect((error as DomainError).code).toBe(code)
    return
  }
  throw new Error(`expected ${code}`)
}

describe("scoreOwnedQuiz", () => {
  it("counts correct selections and sets maxScore to the item count", () => {
    const result = scoreOwnedQuiz(THREE_ITEM_QUIZ, [
      selection(0, 1),
      selection(1, 0),
      selection(2, 0),
    ])

    expect(result.score).toBe(2)
    expect(result.maxScore).toBe(3)
    expect(result.passed).toBe(true)
  })

  it("passes when score equals minimumCorrectCount", () => {
    const result = scoreOwnedQuiz(
      { ...THREE_ITEM_QUIZ, minimumCorrectCount: 1 },
      [selection(0, 1), selection(1, 1), selection(2, 0)],
    )

    expect(result.score).toBe(1)
    expect(result.passed).toBe(true)
  })

  it("fails when score is below minimumCorrectCount", () => {
    const result = scoreOwnedQuiz(THREE_ITEM_QUIZ, [
      selection(0, 0),
      selection(1, 1),
      selection(2, 0),
    ])

    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it("does not treat 2 as an implicit threshold", () => {
    const result = scoreOwnedQuiz(
      {
        minimumCorrectCount: 1,
        items: [
          { options: ["a", "b"], correctIndex: 0 },
          { options: ["a", "b"], correctIndex: 1 },
        ],
      },
      [selection(0, 0), selection(1, 0)],
    )

    expect(result.score).toBe(1)
    expect(result.maxScore).toBe(2)
    expect(result.passed).toBe(true)
  })

  it("passes when every selection matches the key", () => {
    const result = scoreOwnedQuiz(THREE_ITEM_QUIZ, [
      selection(2, 2),
      selection(0, 1),
      selection(1, 0),
    ])

    expect(result.score).toBe(3)
    expect(result.maxScore).toBe(3)
    expect(result.passed).toBe(true)
    expect(result.answers).toEqual([
      { questionIndex: 0, selectedIndex: 1, correct: true },
      { questionIndex: 1, selectedIndex: 0, correct: true },
      { questionIndex: 2, selectedIndex: 2, correct: true },
    ])
  })

  it("returns the same result for the same inputs", () => {
    const selections = [selection(0, 1), selection(1, 0), selection(2, 2)]
    expect(scoreOwnedQuiz(THREE_ITEM_QUIZ, selections)).toEqual(
      scoreOwnedQuiz(THREE_ITEM_QUIZ, selections),
    )
  })

  it("orders answers by questionIndex", () => {
    const result = scoreOwnedQuiz(THREE_ITEM_QUIZ, [
      selection(2, 0),
      selection(0, 1),
      selection(1, 1),
    ])

    expect(result.answers.map((answer) => answer.questionIndex)).toEqual([0, 1, 2])
  })

  it("ignores a client-added correct flag", () => {
    const result = scoreOwnedQuiz(THREE_ITEM_QUIZ, [
      { questionIndex: 0, selectedIndex: 0, correct: true },
      { questionIndex: 1, selectedIndex: 0, correct: false },
      { questionIndex: 2, selectedIndex: 2, correct: false },
    ] as QuizSelection[])

    expect(result.answers[0]).toEqual({ questionIndex: 0, selectedIndex: 0, correct: false })
    expect(result.score).toBe(2)
  })

  it("ignores a client-added score field on the quiz", () => {
    const result = scoreOwnedQuiz(
      { ...THREE_ITEM_QUIZ, score: 99 } as OwnedQuizDefinition,
      [selection(0, 1), selection(1, 0), selection(2, 0)],
    )

    expect(result.score).toBe(2)
  })

  it("rejects an empty or malformed quiz", () => {
    expectCode(() => scoreOwnedQuiz({ minimumCorrectCount: 1, items: [] }, []), "QUIZ_DEFINITION_INVALID")
    expectCode(
      () =>
        scoreOwnedQuiz(
          {
            minimumCorrectCount: 1,
            items: [{ options: [], correctIndex: 0 }],
          },
          [],
        ),
      "QUIZ_DEFINITION_INVALID",
    )
    expectCode(
      () =>
        scoreOwnedQuiz(
          {
            minimumCorrectCount: 1,
            items: [{ options: ["a"], correctIndex: 1 }],
          },
          [selection(0, 0)],
        ),
      "QUIZ_DEFINITION_INVALID",
    )
  })

  it("rejects an invalid minimumCorrectCount", () => {
    const items = THREE_ITEM_QUIZ.items
    expectCode(
      () => scoreOwnedQuiz({ minimumCorrectCount: 0, items }, [selection(0, 1), selection(1, 0), selection(2, 2)]),
      "QUIZ_DEFINITION_INVALID",
    )
    expectCode(
      () => scoreOwnedQuiz({ minimumCorrectCount: 4, items }, [selection(0, 1), selection(1, 0), selection(2, 2)]),
      "QUIZ_DEFINITION_INVALID",
    )
    expectCode(
      () => scoreOwnedQuiz({ minimumCorrectCount: 1.5, items }, [selection(0, 1), selection(1, 0), selection(2, 2)]),
      "QUIZ_DEFINITION_INVALID",
    )
  })

  it("rejects empty, short, and long selections", () => {
    expectCode(() => scoreOwnedQuiz(THREE_ITEM_QUIZ, []), "QUIZ_SELECTION_INVALID")
    expectCode(
      () => scoreOwnedQuiz(THREE_ITEM_QUIZ, [selection(0, 1), selection(1, 0)]),
      "QUIZ_SELECTION_INVALID",
    )
    expectCode(
      () =>
        scoreOwnedQuiz(THREE_ITEM_QUIZ, [
          selection(0, 1),
          selection(1, 0),
          selection(2, 2),
          selection(3, 0),
        ]),
      "QUIZ_SELECTION_INVALID",
    )
  })

  it("rejects a duplicate questionIndex", () => {
    expectCode(
      () => scoreOwnedQuiz(THREE_ITEM_QUIZ, [selection(0, 1), selection(0, 0), selection(1, 0)]),
      "QUIZ_SELECTION_INVALID",
    )
  })

  it("rejects non-integer, negative, and out-of-range indexes", () => {
    expectCode(
      () =>
        scoreOwnedQuiz(THREE_ITEM_QUIZ, [
          selection(0, 1),
          selection(1.5, 0),
          selection(2, 2),
        ]),
      "QUIZ_SELECTION_INVALID",
    )
    expectCode(
      () =>
        scoreOwnedQuiz(THREE_ITEM_QUIZ, [
          selection(0, 1),
          selection(-1, 0),
          selection(2, 2),
        ]),
      "QUIZ_SELECTION_INVALID",
    )
    expectCode(
      () =>
        scoreOwnedQuiz(THREE_ITEM_QUIZ, [
          selection(0, 1),
          selection(1, 9),
          selection(2, 2),
        ]),
      "QUIZ_SELECTION_INVALID",
    )
  })
})
