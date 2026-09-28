import { describe, expect, it } from "vitest"
import {
  assertOwnedQuizDefinition,
  DomainError,
  scoringProvenanceFromPersisted,
} from "../../../src/modules/evidence/index.js"

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

const valid = {
  minimumCorrectCount: 1,
  items: [{ options: ["a", "b"], correctIndex: 1 }],
}

describe("assertOwnedQuizDefinition", () => {
  it("returns only the accepted quiz fields", () => {
    expect(assertOwnedQuizDefinition({ ...valid, extra: true })).toEqual(valid)
  })

  it("rejects an empty item list", () => {
    expectCode(
      () => assertOwnedQuizDefinition({ minimumCorrectCount: 1, items: [] }),
      "QUIZ_DEFINITION_INVALID",
    )
  })

  it("rejects empty options", () => {
    expectCode(
      () =>
        assertOwnedQuizDefinition({
          minimumCorrectCount: 1,
          items: [{ options: [], correctIndex: 0 }],
        }),
      "QUIZ_DEFINITION_INVALID",
    )
  })

  it("rejects a non-integer, negative, or out-of-range correctIndex", () => {
    for (const correctIndex of [1.5, -1, 2, "1"]) {
      expectCode(
        () =>
          assertOwnedQuizDefinition({
            minimumCorrectCount: 1,
            items: [{ options: ["a", "b"], correctIndex }],
          }),
        "QUIZ_DEFINITION_INVALID",
      )
    }
  })

  it("rejects a non-integer, too-small, or too-large minimumCorrectCount", () => {
    for (const minimumCorrectCount of [1.5, 0, 2]) {
      expectCode(
        () => assertOwnedQuizDefinition({ ...valid, minimumCorrectCount }),
        "QUIZ_DEFINITION_INVALID",
      )
    }
  })

  it("rejects malformed persisted JSON instead of returning a quiz", () => {
    expectCode(() => assertOwnedQuizDefinition({ items: { options: ["a"] } }), "QUIZ_DEFINITION_INVALID")
    expectCode(() => assertOwnedQuizDefinition(null), "QUIZ_DEFINITION_INVALID")
  })
})

describe("scoringProvenanceFromPersisted", () => {
  it("maps only the exact server value to server_recalculated", () => {
    expect(scoringProvenanceFromPersisted("server_recalculated")).toBe("server_recalculated")
  })

  it("maps missing, null, malformed, and unknown values to client_declared", () => {
    for (const value of [undefined, null, "", "client_declared", "trusted", 1, { value: "server_recalculated" }]) {
      expect(scoringProvenanceFromPersisted(value)).toBe("client_declared")
    }
  })
})
