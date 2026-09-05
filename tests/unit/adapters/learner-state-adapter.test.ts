import { describe, expect, it } from "vitest"
import {
  pathBindPatch,
  pathClearPatchForGoalChange,
} from "../../../src/adapters/store/index.js"

describe("learner-state-adapter", () => {
  it("goal change derives empty pathId/pathTitle from DomainLearnerState", () => {
    const patch = pathClearPatchForGoalChange()
    // Domain bindActiveGoal clears path refs → adapter maps undefined to ""
    expect(patch.pathId).toBe("")
    expect(patch.pathTitle).toBe("")
  })

  it("steps/skills remain explicit legacy adapter clears", () => {
    const patch = pathClearPatchForGoalChange()
    expect(patch.steps).toEqual([])
    expect(patch.skills).toEqual([])
  })

  it("path clear patch does not expose unrelated domain fields", () => {
    const patch = pathClearPatchForGoalChange()
    expect(Object.keys(patch).sort()).toEqual(["pathId", "pathTitle", "skills", "steps"].sort())
    expect(patch).not.toHaveProperty("activeGoalId")
    expect(patch).not.toHaveProperty("learnerId")
    expect(patch).not.toHaveProperty("currentStepId")
  })

  it("pathBindPatch returns path refs only (no steps / profile)", () => {
    const patch = pathBindPatch({ pathId: "path-1", pathTitle: "GPS" })
    expect(patch).toEqual({ pathId: "path-1", pathTitle: "GPS" })
    expect(patch).not.toHaveProperty("steps")
    expect(patch).not.toHaveProperty("profile")
    expect(patch).not.toHaveProperty("skills")
  })

  it("pathBindPatch is deterministic for same inputs", () => {
    const a = pathBindPatch({ pathId: "p", pathTitle: "T" })
    const b = pathBindPatch({ pathId: "p", pathTitle: "T" })
    expect(a).toEqual(b)
  })
})
