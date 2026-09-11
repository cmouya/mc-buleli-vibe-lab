import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import { confirmGoal } from "../../../src/application/confirm-goal.js"

const NOW = "2026-09-11T10:00:00.000Z"

const analyzedFields = {
  goal: "Maîtriser Outlook",
  level: "debutant",
  hoursPerWeek: 5,
  intent: "professionnel",
  analyzed: true,
  confirmed: false,
}

describe("application — confirmGoal", () => {
  it("confirms an analyzed goal without inventing a path", () => {
    const patch = confirmGoal(analyzedFields, { now: NOW })
    expect(patch.confirmed).toBe(true)
    expect(patch.analyzed).toBe(true)
    expect(patch).not.toHaveProperty("pathId")
    expect(patch).not.toHaveProperty("steps")
  })

  it("propagates GOAL_NOT_ANALYZED when the goal is still draft", () => {
    expect(() =>
      confirmGoal({
        ...analyzedFields,
        analyzed: false,
      }),
    ).toThrow(DomainError)
  })
})
