import { afterEach, expect, it, vi } from "vitest"

vi.mock("../../src/router.js", () => ({
  initRouter: vi.fn(callback => callback({ parts: ["roadmap"] })),
  navigate: vi.fn(),
}))
vi.mock("../../src/adapters/ai/path-generator.js", () => ({ getPathGenerator: vi.fn() }))

afterEach(async () => {
  const { cancelRoadmapGeneration } = await import("../../src/views/roadmap.js")
  cancelRoadmapGeneration()
  document.body.innerHTML = ""
  vi.useRealTimers()
})

it("focuses Roadmap error and retry states, restores language focus and generates once per retry", async () => {
  vi.useFakeTimers()
  document.body.innerHTML = '<div id="app"></div>'
  window.history.replaceState(null, "", "#/roadmap")
  localStorage.clear()
  sessionStorage.clear()
  const store = await import("../../src/store.js")
  store.resetLearner()
  store.setProfile({ goal: "Outlook", level: "debutant", hoursPerWeek: 5 })
  store.setAnalyzed(true)
  store.confirmCurrentGoal()
  const { getPathGenerator } = await import("../../src/adapters/ai/path-generator.js")
  const generate = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({
    pathId: "outlook", pathTitle: "Outlook", steps: [{ id: "outlook-1", title: "Outlook" }],
  })
  getPathGenerator.mockReturnValue({ generatePath: generate })
  await import("../../src/main.js")
  await vi.advanceTimersByTimeAsync(0)
  let heading = document.querySelector("main h1")
  expect(document.activeElement).toBe(heading)
  expect(heading.textContent).toBe("Parcours indisponible")
  expect(document.getElementById(heading.getAttribute("aria-describedby")).textContent).toContain("a échoué")
  expect(document.querySelector('main [role="alert"], main [aria-live], main [role="status"]')).toBeNull()
  await vi.advanceTimersByTimeAsync(5000)
  expect(generate).toHaveBeenCalledTimes(1)
  document.querySelector('[data-lang="en"]').click()
  expect(document.activeElement).toBe(document.querySelector('[data-lang="en"]'))
  expect(document.querySelector("main h1").textContent).toBe("Path unavailable")
  expect(document.querySelector("#roadmap-error-description").textContent).toContain("failed")
  document.querySelector("[data-retry-roadmap]").click()
  heading = document.querySelector("main h1")
  expect(document.activeElement).toBe(heading)
  expect(heading.textContent).toBe("Building your itinerary…")
  expect(document.getElementById(heading.getAttribute("aria-describedby"))).not.toBeNull()
  await vi.advanceTimersByTimeAsync(1400)
  expect(generate).toHaveBeenCalledTimes(2)
  expect(document.activeElement).toBe(document.querySelector("main h1"))
  expect(document.activeElement.textContent).toBe("Your destination")
  expect(document.querySelector('[data-testid="demo-notice"]')).not.toBeNull()
})
