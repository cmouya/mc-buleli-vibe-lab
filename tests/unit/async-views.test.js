import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { bindGoal, renderGoal, cancelGoalPreparation } from "../../src/views/goal.js"
import { bindRoadmap, renderRoadmap, cancelRoadmapGeneration } from "../../src/views/roadmap.js"
import { getState, resetLearner, setProfile, setAnalyzed, confirmCurrentGoal } from "../../src/store.js"
import { setLanguage } from "../../src/i18n/index.js"
import { getPathGenerator } from "../../src/adapters/ai/path-generator.js"
vi.mock("../../src/adapters/ai/path-generator.js", () => ({ getPathGenerator: vi.fn() }))

const path = { pathId: "outlook", pathTitle: "Outlook", steps: [{ id: "outlook-1", title: "Outlook" }] }
let root, generate, redraw
function profile(goal = "Outlook", confirmed = true) {
  setProfile({ goal, level: "debutant", hoursPerWeek: 5 })
  if (confirmed) { setAnalyzed(true); confirmCurrentGoal() }
}
function mountRoadmap() {
  root.innerHTML = renderRoadmap()
  bindRoadmap(root, redraw)
}
function mountGoal() {
  root.innerHTML = renderGoal()
  bindGoal(root, redraw)
}
function submitGoal() {
  root.querySelector("#goal").value = "Outlook"
  root.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }))
}
beforeEach(() => {
  vi.useFakeTimers()
  window.history.replaceState(null, "", "#/goal")
  resetLearner()
  setLanguage("fr")
  root = document.createElement("main")
  generate = vi.fn().mockResolvedValue(path)
  getPathGenerator.mockReturnValue({ generatePath: generate })
})
afterEach(() => { cancelGoalPreparation(); cancelRoadmapGeneration(); vi.useRealTimers() })

describe("Goal preparation", () => {
  it("ignores a timer when the URL changed before route cleanup", async () => {
    redraw = vi.fn(mountGoal); mountGoal(); submitGoal(); redraw.mockClear()
    window.history.replaceState(null, "", "#/")
    await vi.advanceTimersByTimeAsync(2000)
    expect(getState().analyzed).toBe(false)
    expect(redraw).not.toHaveBeenCalled()
  })
  it("cancels on leave and resumes the saved form without late writes", async () => {
    redraw = vi.fn(mountGoal); mountGoal(); submitGoal()
    cancelGoalPreparation(); redraw.mockClear()
    await vi.advanceTimersByTimeAsync(2000)
    expect(getState().analyzed).toBe(false)
    expect(redraw).not.toHaveBeenCalled()
    mountGoal(); expect(root.querySelector("#goal").value).toBe("Outlook")
  })
  it("does not analyze a replacement profile", async () => {
    redraw = vi.fn(mountGoal); mountGoal(); submitGoal(); profile("New goal", false)
    await vi.advanceTimersByTimeAsync(2000)
    expect(getState().goal).toBe("New goal")
    expect(getState().analyzed).toBe(false)
  })
  it("keeps the original deadline when language changes", async () => {
    redraw = vi.fn(mountGoal); mountGoal(); submitGoal()
    await vi.advanceTimersByTimeAsync(800)
    setLanguage("en"); mountGoal()
    expect(root.textContent).toContain("Preparing your goal")
    await vi.advanceTimersByTimeAsync(800)
    expect(root.querySelector('[data-testid="goal-confirmation"]')).not.toBeNull()
    expect(getState().confirmed).toBe(false)
  })
})

describe("Roadmap generation", () => {
  it("ignores a delayed write when the URL changed before route cleanup", async () => {
    profile(); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(0)
    window.history.replaceState(null, "", "#/")
    await vi.advanceTimersByTimeAsync(2000)
    expect(getState().steps).toEqual([])
    expect(redraw).not.toHaveBeenCalled()
  })
  it("ignores an old promise after leave and return, while the new operation completes", async () => {
    let resolveOld
    generate.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve }))
    profile(); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(0)
    cancelRoadmapGeneration(); mountRoadmap()
    resolveOld({ ...path, pathId: "stale" })
    await vi.advanceTimersByTimeAsync(1400)
    expect(generate).toHaveBeenCalledTimes(2)
    expect(getState().pathId).toBe("outlook")
  })
  it("cancels the display delay and never writes after leaving", async () => {
    profile(); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(0)
    cancelRoadmapGeneration()
    await vi.advanceTimersByTimeAsync(2000)
    expect(getState().steps).toEqual([])
    expect(redraw).not.toHaveBeenCalled()
  })
  it("ignores results for a replaced goal", async () => {
    profile(); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(0)
    profile("Different goal")
    await vi.advanceTimersByTimeAsync(2000)
    expect(getState().pathId).toBe("")
    expect(redraw).not.toHaveBeenCalled()
  })
  it("preserves one generation and its deadline across language rerenders", async () => {
    profile(); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(700)
    setLanguage("en"); mountRoadmap()
    expect(root.textContent).toContain("Building your itinerary")
    await vi.advanceTimersByTimeAsync(700)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(root.textContent).toContain("Your destination")
  })
  it("keeps a translated error until explicit retry without automatic loops", async () => {
    generate.mockRejectedValueOnce(new Error("offline"))
    profile(); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(5000)
    expect(root.textContent).toContain("Parcours indisponible")
    expect(generate).toHaveBeenCalledTimes(1)
    setLanguage("en"); mountRoadmap()
    expect(root.textContent).toContain("Path unavailable")
    root.querySelector("[data-retry-roadmap]").click()
    await vi.advanceTimersByTimeAsync(1400)
    expect(generate).toHaveBeenCalledTimes(2)
    expect(getState().pathId).toBe("outlook")
  })
  it("requires confirmation before generating", async () => {
    profile("Outlook", false); redraw = vi.fn(mountRoadmap); mountRoadmap()
    await vi.advanceTimersByTimeAsync(2000)
    expect(generate).not.toHaveBeenCalled()
    expect(getState().confirmed).toBe(false)
    expect(window.location.hash).toBe("#/goal")
  })
})
