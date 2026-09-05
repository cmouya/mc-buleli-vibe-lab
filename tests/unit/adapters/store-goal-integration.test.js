import { beforeEach, describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  confirmCurrentGoal,
  getState,
  loadState,
  resetLearner,
  setAnalyzed,
  setPath,
  setProfile,
} from "../../../src/store.js"
import { bindGoal, renderGoal } from "../../../src/views/goal.js"

const STEPS = [
  { id: "s1", title: "Step 1", description: "D1", level: "Débutant", duration: "45 min", skill: "A" },
]

describe("store — goal integration (2.2-B)", () => {
  beforeEach(() => {
    localStorage.clear()
    resetLearner()
    loadState()
  })

  it("confirmCurrentGoal after analyze sets confirmed", () => {
    setProfile({ goal: "Test goal", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)
    expect(getState().confirmed).toBe(false)
    confirmCurrentGoal()
    expect(getState().analyzed).toBe(true)
    expect(getState().confirmed).toBe(true)
  })

  it("setPath rejects analyzed but unconfirmed Goal (I-01)", () => {
    setProfile({ goal: "Test goal", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)
    expect(() =>
      setPath({ pathId: "p1", pathTitle: "P", steps: STEPS.map((s) => ({ ...s })) }),
    ).toThrow(DomainError)
    expect(getState().steps).toHaveLength(0)
    expect(getState().confirmed).toBe(false)
  })

  it("setPath does not silently confirm", () => {
    setProfile({ goal: "Test goal", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)
    try {
      setPath({ pathId: "p1", pathTitle: "P", steps: STEPS.map((s) => ({ ...s })) })
    } catch {
      // expected reject
    }
    expect(getState().confirmed).toBe(false)
  })

  it("setPath succeeds after explicit confirm", () => {
    setProfile({ goal: "Test goal", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)
    confirmCurrentGoal()
    setPath({ pathId: "p1", pathTitle: "P", steps: STEPS.map((s) => ({ ...s })) })
    expect(getState().pathId).toBe("p1")
    expect(getState().steps).toHaveLength(1)
    expect(getState().steps[0].status).toBe("current")
  })

  it("setProfile clears confirmed and path", () => {
    setProfile({ goal: "A", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)
    confirmCurrentGoal()
    setPath({ pathId: "p1", pathTitle: "P", steps: STEPS.map((s) => ({ ...s })) })
    setProfile({ goal: "B", level: "debutant", hoursPerWeek: 5 })
    expect(getState().confirmed).toBe(false)
    expect(getState().analyzed).toBe(false)
    expect(getState().steps).toHaveLength(0)
  })

  it("Confirmation CTA click produces confirmed Goal state", () => {
    setProfile({ goal: "CTA goal", level: "debutant", hoursPerWeek: 5 })
    setAnalyzed(true)

    const root = document.createElement("div")
    root.innerHTML = renderGoal()
    bindGoal(root, () => {})

    const cta = root.querySelector(".goal-confirm a.btn--primary[href='#/roadmap']")
    expect(cta).toBeTruthy()
    cta.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }))

    expect(getState().confirmed).toBe(true)
    expect(getState().analyzed).toBe(true)
  })
})
