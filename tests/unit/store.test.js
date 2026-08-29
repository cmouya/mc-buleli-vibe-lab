import { beforeEach, describe, expect, it } from "vitest"
import {
  completeStep,
  getCompletedCompetenciesCount,
  getCurrentStep,
  getNextStep,
  getProgressPercent,
  getState,
  loadState,
  resetLearner,
  setPath,
  setProfile,
} from "../../src/store.js"

const SAMPLE_STEPS = [
  { id: "s1", title: "Step 1", description: "D1", level: "Débutant", duration: "45 min", skill: "Skill A" },
  { id: "s2", title: "Step 2", description: "D2", level: "Débutant", duration: "50 min", skill: "Skill B" },
  { id: "s3", title: "Step 3", description: "D3", level: "Intermédiaire", duration: "55 min", skill: "Skill C" },
]

describe("store — progression", () => {
  beforeEach(() => {
    localStorage.clear()
    resetLearner()
    loadState()
    setProfile({
      goal: "Test goal",
      level: "debutant",
      hoursPerWeek: 5,
    })
    setPath({
      pathId: "test-path",
      pathTitle: "Test path",
      steps: SAMPLE_STEPS.map((step) => ({ ...step })),
    })
  })

  it("returns 0% progress when no step is completed", () => {
    expect(getProgressPercent()).toBe(0)
    expect(getCompletedCompetenciesCount()).toBe(0)
  })

  it("calculates progress after one step completed (~33% for 3 steps)", () => {
    completeStep("s1")
    expect(getProgressPercent()).toBe(33)
    expect(getCompletedCompetenciesCount()).toBe(1)
  })

  it("marks first step done and unlocks second as current", () => {
    completeStep("s1")
    const state = getState()
    expect(state.steps[0].status).toBe("done")
    expect(state.steps[1].status).toBe("current")
    expect(state.steps[2].status).toBe("todo")
    expect(state.skills).toContain("Skill A")
  })

  it("getCurrentStep returns the current step", () => {
    expect(getCurrentStep()?.id).toBe("s1")
    completeStep("s1")
    expect(getCurrentStep()?.id).toBe("s2")
  })

  it("getNextStep returns the following step", () => {
    expect(getNextStep()?.id).toBe("s2")
    completeStep("s1")
    expect(getNextStep()?.id).toBe("s3")
  })

  it("ignores completeStep for unknown step id", () => {
    completeStep("unknown")
    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
  })

  it("does not duplicate skills when completing same step twice", () => {
    completeStep("s1")
    completeStep("s1")
    expect(getState().skills.filter((s) => s === "Skill A")).toHaveLength(1)
  })

  it("persists progression in localStorage", () => {
    completeStep("s1")
    loadState()
    expect(getProgressPercent()).toBe(33)
    expect(getState().steps[0].status).toBe("done")
  })
})

describe("store — path initialization", () => {
  beforeEach(() => {
    localStorage.clear()
    resetLearner()
    loadState()
  })

  it("sets first step as current and others as todo", () => {
    setPath({
      pathId: "p1",
      pathTitle: "Path",
      steps: SAMPLE_STEPS.map((step) => ({ ...step })),
    })
    const statuses = getState().steps.map((step) => step.status)
    expect(statuses).toEqual(["current", "todo", "todo"])
  })

  it("clears path when profile is reset via setProfile", () => {
    setProfile({ goal: "G", level: "debutant", hoursPerWeek: 5 })
    setPath({ pathId: "p1", pathTitle: "P", steps: SAMPLE_STEPS.map((s) => ({ ...s })) })
    setProfile({ goal: "New goal", level: "debutant", hoursPerWeek: 5 })
    expect(getState().steps).toHaveLength(0)
    expect(getProgressPercent()).toBe(0)
  })
})
