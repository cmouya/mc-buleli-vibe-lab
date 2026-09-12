import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"

const analyzedBody = {
  goal: "Maîtriser Outlook",
  level: "debutant",
  hoursPerWeek: 5,
  intent: "professionnel",
  analyzed: true,
}

describe("API — POST /api/v1/goals/confirm", () => {
  it("confirms an analyzed goal via the application use case", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/goals/confirm",
      payload: analyzedBody,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ confirmed: true, analyzed: true })
    expect(response.json()).not.toHaveProperty("pathId")
    expect(response.json()).not.toHaveProperty("steps")
    await app.close()
  })

  it("maps GOAL_NOT_ANALYZED to 409 without confirming", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/goals/confirm",
      payload: { ...analyzedBody, analyzed: false },
    })
    expect(response.statusCode).toBe(409)
    expect(response.json()).toMatchObject({ code: "GOAL_NOT_ANALYZED" })
    await app.close()
  })

  it("rejects a malformed body with 400", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/goals/confirm",
      payload: { goal: "" },
    })
    expect(response.statusCode).toBe(400)
    await app.close()
  })
})
