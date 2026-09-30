import { DomainError } from "../modules/shared/index.js"

export const quizAttemptBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["selections"],
  properties: {
    selections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["questionIndex", "selectedIndex"],
        properties: {
          questionIndex: { type: "integer", minimum: 0 },
          selectedIndex: { type: "integer", minimum: 0 },
        },
      },
    },
  },
} as const

function hasOnlyKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
}

/** Route-local raw shape guard. The domain scorer owns coverage and index bounds. */
export function assertQuizAttemptBody(body: unknown): void {
  if (!hasOnlyKeys(body, ["selections"]) || !Array.isArray(body.selections)
    || !body.selections.every((selection: unknown) =>
      hasOnlyKeys(selection, ["questionIndex", "selectedIndex"])
      && typeof selection.questionIndex === "number"
      && typeof selection.selectedIndex === "number")) {
    throw new DomainError("QUIZ_SELECTION_INVALID", "Only questionIndex and selectedIndex selections are accepted")
  }
}
