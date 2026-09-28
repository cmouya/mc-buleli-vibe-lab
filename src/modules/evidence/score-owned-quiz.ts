/**
 * Pure trusted-quiz scorer. Server quiz definition and selections are the only inputs.
 * Does not read client score, passed, correct, or provenance. No I/O.
 */

import { DomainError } from "../shared/domain-error.js"

export interface OwnedQuizItem {
  options: readonly string[]
  correctIndex: number
}

export interface OwnedQuizDefinition {
  minimumCorrectCount: number
  items: readonly OwnedQuizItem[]
}

export interface QuizSelection {
  questionIndex: number
  selectedIndex: number
}

export interface ScoredQuizAnswer {
  questionIndex: number
  selectedIndex: number
  correct: boolean
}

export interface ScoredQuizAttempt {
  score: number
  maxScore: number
  passed: boolean
  answers: readonly ScoredQuizAnswer[]
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

function assertQuizDefinition(quiz: OwnedQuizDefinition): void {
  if (!quiz || !Array.isArray(quiz.items) || quiz.items.length === 0) {
    throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz has no items")
  }

  for (const item of quiz.items) {
    if (!item || !Array.isArray(item.options) || item.options.length === 0) {
      throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz item is malformed")
    }
    if (!isNonNegativeInteger(item.correctIndex) || item.correctIndex >= item.options.length) {
      throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz item is malformed")
    }
  }

  const itemCount = quiz.items.length
  if (
    typeof quiz.minimumCorrectCount !== "number" ||
    !Number.isInteger(quiz.minimumCorrectCount) ||
    quiz.minimumCorrectCount < 1 ||
    quiz.minimumCorrectCount > itemCount
  ) {
    throw new DomainError(
      "QUIZ_DEFINITION_INVALID",
      "minimumCorrectCount is outside 1..itemCount",
    )
  }
}

function assertSelections(
  quiz: OwnedQuizDefinition,
  selections: readonly QuizSelection[],
): void {
  const itemCount = quiz.items.length
  if (!Array.isArray(selections) || selections.length !== itemCount) {
    throw new DomainError("QUIZ_SELECTION_INVALID", "selections must match the quiz item count")
  }

  for (const selection of selections) {
    if (
      !selection ||
      !isNonNegativeInteger(selection.questionIndex) ||
      !isNonNegativeInteger(selection.selectedIndex)
    ) {
      throw new DomainError("QUIZ_SELECTION_INVALID", "indexes must be non-negative integers")
    }
  }

  for (const selection of selections) {
    if (selection.questionIndex >= itemCount) {
      throw new DomainError("QUIZ_SELECTION_INVALID", "questionIndex is outside the quiz")
    }
  }

  const seen = new Set<number>()
  for (const selection of selections) {
    if (seen.has(selection.questionIndex)) {
      throw new DomainError("QUIZ_SELECTION_INVALID", "duplicate questionIndex")
    }
    seen.add(selection.questionIndex)
  }

  for (let index = 0; index < itemCount; index += 1) {
    if (!seen.has(index)) {
      throw new DomainError("QUIZ_SELECTION_INVALID", "missing question index")
    }
  }

  for (const selection of selections) {
    const item = quiz.items[selection.questionIndex]
    if (selection.selectedIndex >= item.options.length) {
      throw new DomainError(
        "QUIZ_SELECTION_INVALID",
        "selectedIndex is outside the item options",
      )
    }
  }
}

/**
 * Score a structurally valid submission. Answers are returned in question-index order.
 */
export function scoreOwnedQuiz(
  quiz: OwnedQuizDefinition,
  selections: readonly QuizSelection[],
): ScoredQuizAttempt {
  assertQuizDefinition(quiz)
  assertSelections(quiz, selections)

  const selectedByQuestion = new Map<number, number>()
  for (const selection of selections) {
    selectedByQuestion.set(selection.questionIndex, selection.selectedIndex)
  }

  const answers: ScoredQuizAnswer[] = quiz.items.map((item, questionIndex) => {
    const selectedIndex = selectedByQuestion.get(questionIndex)
    if (selectedIndex === undefined) {
      throw new DomainError("QUIZ_SELECTION_INVALID", "missing question index")
    }
    return {
      questionIndex,
      selectedIndex,
      correct: selectedIndex === item.correctIndex,
    }
  })

  const score = answers.filter((answer) => answer.correct).length
  return {
    score,
    maxScore: quiz.items.length,
    passed: score >= quiz.minimumCorrectCount,
    answers,
  }
}
