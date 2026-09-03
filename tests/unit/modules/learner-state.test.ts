import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  bindActiveGoal,
  bindPath,
  clearPath,
  createLearnerState,
} from "../../../src/modules/learner/index.js"

const NOW = "2026-09-03T15:00:00.000Z"

describe("learner domain — LearnerState", () => {
  it("creates session state without profile or preferences (Learner ≠ LearnerState)", () => {
    const state = createLearnerState({ learnerId: "l1" })
    expect(state).toEqual({
      learnerId: "l1",
      updatedAt: null,
    })
    expect(state).not.toHaveProperty("profile")
    expect(state).not.toHaveProperty("preferences")
    expect(state).not.toHaveProperty("skills")
  })

  it("bindActiveGoal clears path fields", () => {
    let state = createLearnerState({ learnerId: "l1" })
    state = bindPath(
      state,
      { pathId: "p1", pathTitle: "Path", currentStepId: "st1" },
      { now: NOW },
    )
    expect(state.pathId).toBe("p1")

    state = bindActiveGoal(state, "goal-2", { now: "2026-09-03T16:00:00.000Z" })
    expect(state.activeGoalId).toBe("goal-2")
    expect(state.pathId).toBeUndefined()
    expect(state.pathTitle).toBeUndefined()
    expect(state.currentStepId).toBeUndefined()
    expect(state.updatedAt).toBe("2026-09-03T16:00:00.000Z")
  })

  it("bindPath attaches path refs only", () => {
    const state = bindPath(
      createLearnerState(),
      { pathId: "path-1", pathTitle: "GPS", currentStepId: "step-1" },
      { now: NOW },
    )
    expect(state.pathId).toBe("path-1")
    expect(state.pathTitle).toBe("GPS")
    expect(state.currentStepId).toBe("step-1")
    expect(state.updatedAt).toBe(NOW)
    expect(state).not.toHaveProperty("steps")
  })

  it("clearPath keeps learnerId and activeGoalId", () => {
    let state = createLearnerState({ learnerId: "l1", activeGoalId: "g1" })
    state = bindPath(state, { pathId: "p1" }, { now: NOW })
    state = clearPath(state, { now: "2026-09-03T17:00:00.000Z" })
    expect(state.learnerId).toBe("l1")
    expect(state.activeGoalId).toBe("g1")
    expect(state.pathId).toBeUndefined()
    expect(state.updatedAt).toBe("2026-09-03T17:00:00.000Z")
  })

  it("rejects empty goalId / pathId", () => {
    const state = createLearnerState()
    expect(() => bindActiveGoal(state, "  ")).toThrow(DomainError)
    expect(() => bindPath(state, { pathId: "" })).toThrow(DomainError)
  })
})
