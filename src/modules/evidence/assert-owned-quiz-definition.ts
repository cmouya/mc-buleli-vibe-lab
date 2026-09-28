/**
 * Validates a Step-owned quiz definition before it is stored or returned.
 * Does not score selections.
 */

import type { OwnedQuizDefinition, OwnedQuizItem } from "./score-owned-quiz.js"
import { DomainError } from "../shared/domain-error.js"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
}

/**
 * Rejects an empty or malformed quiz. Returns a definition containing only
 * the accepted fields. Persisted JSON must pass this before it is usable.
 */
export function assertOwnedQuizDefinition(value: unknown): OwnedQuizDefinition {
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length === 0) {
    throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz has no items")
  }

  const items: OwnedQuizItem[] = []
  for (const raw of value.items) {
    if (!isRecord(raw) || !Array.isArray(raw.options) || raw.options.length === 0) {
      throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz item is malformed")
    }
    if (!isNonNegativeInteger(raw.correctIndex) || raw.correctIndex >= raw.options.length) {
      throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz item is malformed")
    }
    const options = raw.options.map((option) => {
      if (typeof option !== "string") {
        throw new DomainError("QUIZ_DEFINITION_INVALID", "quiz item is malformed")
      }
      return option
    })
    items.push({ options, correctIndex: raw.correctIndex })
  }

  const itemCount = items.length
  if (
    typeof value.minimumCorrectCount !== "number" ||
    !Number.isInteger(value.minimumCorrectCount) ||
    value.minimumCorrectCount < 1 ||
    value.minimumCorrectCount > itemCount
  ) {
    throw new DomainError(
      "QUIZ_DEFINITION_INVALID",
      "minimumCorrectCount is outside 1..itemCount",
    )
  }

  return {
    minimumCorrectCount: value.minimumCorrectCount,
    items,
  }
}
