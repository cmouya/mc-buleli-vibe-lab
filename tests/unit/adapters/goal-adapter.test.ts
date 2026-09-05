import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  applyConfirmGoal,
  applyCreateProfile,
  applyMarkAnalyzed,
  assertGoalReadyForPathFromLegacy,
  toDomainGoal,
} from "../../../src/adapters/store/index.js"

const NOW = "2026-09-05T10:00:00.000Z"

const baseFields = {
  goal: "Maîtriser Outlook",
  level: "debutant",
  hoursPerWeek: 5,
  intent: "professionnel",
  analyzed: false,
  confirmed: false,
}

describe("goal-adapter", () => {
  it("maps profile input to draft legacy patch and clears path", () => {
    const patch = applyCreateProfile({
      goal: "  Apprendre Excel  ",
      level: "intermediaire",
      hoursPerWeek: 3,
      intent: "academique",
    })

    expect(patch.goal).toBe("Apprendre Excel")
    expect(patch.analyzed).toBe(false)
    expect(patch.confirmed).toBe(false)
    expect(patch.pathId).toBe("")
    expect(patch.steps).toEqual([])
    expect(toDomainGoal({ ...baseFields, ...patch, goal: patch.goal }).status).toBe("draft")
  })

  it("analyzed but unconfirmed Goal is NOT ready for path (I-01)", () => {
    const analyzed = {
      ...baseFields,
      ...applyMarkAnalyzed(baseFields, true, { now: NOW }),
      goal: baseFields.goal,
    }
    expect(analyzed.analyzed).toBe(true)
    expect(analyzed.confirmed).toBe(false)
    expect(toDomainGoal(analyzed).status).toBe("analyzed")
    expect(() => assertGoalReadyForPathFromLegacy(analyzed)).toThrow(DomainError)
  })

  it("explicit confirm produces confirmed Goal that passes assert", () => {
    const analyzed = {
      ...baseFields,
      analyzed: true,
      confirmed: false,
    }
    const confirmedPatch = applyConfirmGoal(analyzed, { now: NOW })
    const confirmed = { ...analyzed, ...confirmedPatch }
    expect(confirmed.confirmed).toBe(true)
    expect(toDomainGoal(confirmed).status).toBe("confirmed")
    expect(() => assertGoalReadyForPathFromLegacy(confirmed)).not.toThrow()
  })

  it("assertGoalReadyForPathFromLegacy does not silently confirm", () => {
    const analyzed = { ...baseFields, analyzed: true, confirmed: false }
    try {
      assertGoalReadyForPathFromLegacy(analyzed)
    } catch {
      // expected
    }
    expect(analyzed.confirmed).toBe(false)
    expect(toDomainGoal(analyzed).status).toBe("analyzed")
  })

  it("cannot confirm before analyze", () => {
    expect(() => applyConfirmGoal(baseFields)).toThrow(DomainError)
  })
})
