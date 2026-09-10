import { beforeEach, describe, expect, it } from "vitest"
import {
  completeStep,
  confirmCurrentGoal,
  getCompletedCompetenciesCount,
  getCurrentStep,
  getNextStep,
  getProgressPercent,
  getState,
  loadState,
  resetLearner,
  setAnalyzed,
  setPath,
  setProfile,
} from "../../src/store.js"
import { applyQuizAttempt } from "../../src/adapters/store/index.js"

const SAMPLE_STEPS = [
  { id: "s1", title: "Step 1", description: "D1", level: "Débutant", duration: "45 min", skill: "Skill A" },
  { id: "s2", title: "Step 2", description: "D2", level: "Débutant", duration: "50 min", skill: "Skill B" },
  { id: "s3", title: "Step 3", description: "D3", level: "Intermédiaire", duration: "55 min", skill: "Skill C" },
]

/** Golden journey fixture: draft → analyzed → confirmed → path (I-01). */
function confirmAndSetPath(path) {
  setAnalyzed(true)
  confirmCurrentGoal()
  setPath(path)
}

function passedEvidence(stepId = "s1") {
  return applyQuizAttempt({
    stepId,
    score: 2,
    total: 3,
    passed: true,
    details: [
      { index: 0, selected: 1, correct: true },
      { index: 1, selected: 1, correct: true },
      { index: 2, selected: 0, correct: false },
    ],
  }).evidence
}

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
    confirmAndSetPath({
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
    completeStep("s1", passedEvidence())
    expect(getProgressPercent()).toBe(33)
    expect(getCompletedCompetenciesCount()).toBe(1)
  })

  it("marks first step done and unlocks second as current", () => {
    completeStep("s1", passedEvidence())
    const state = getState()
    expect(state.steps[0].status).toBe("done")
    expect(state.steps[1].status).toBe("current")
    expect(state.steps[2].status).toBe("todo")
    expect(state.skills).toContain("Skill A")
  })

  it("getCurrentStep returns the current step", () => {
    expect(getCurrentStep()?.id).toBe("s1")
    completeStep("s1", passedEvidence())
    expect(getCurrentStep()?.id).toBe("s2")
  })

  it("getNextStep returns the following step", () => {
    expect(getNextStep()?.id).toBe("s2")
    completeStep("s1", passedEvidence())
    expect(getNextStep()?.id).toBe("s3")
  })

  it("ignores completeStep for unknown step id", () => {
    completeStep("unknown", passedEvidence("unknown"))
    expect(getProgressPercent()).toBe(0)
    expect(getState().steps[0].status).toBe("current")
  })

  it("does not duplicate skills when completing same step twice", () => {
    completeStep("s1", passedEvidence())
    completeStep("s1", passedEvidence())
    expect(getState().skills.filter((s) => s === "Skill A")).toHaveLength(1)
  })

  it("persists progression in localStorage", () => {
    completeStep("s1", passedEvidence())
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
    setProfile({ goal: "G", level: "debutant", hoursPerWeek: 5 })
    confirmAndSetPath({
      pathId: "p1",
      pathTitle: "Path",
      steps: SAMPLE_STEPS.map((step) => ({ ...step })),
    })
    const statuses = getState().steps.map((step) => step.status)
    expect(statuses).toEqual(["current", "todo", "todo"])
  })

  it("clears path when profile is reset via setProfile", () => {
    setProfile({ goal: "G", level: "debutant", hoursPerWeek: 5 })
    confirmAndSetPath({ pathId: "p1", pathTitle: "P", steps: SAMPLE_STEPS.map((s) => ({ ...s })) })
    completeStep("s1", passedEvidence())
    setProfile({ goal: "New goal", level: "debutant", hoursPerWeek: 5 })
    expect(getState().steps).toHaveLength(0)
    expect(getProgressPercent()).toBe(0)
    expect(getState().evidence).toEqual([])
  })
})
