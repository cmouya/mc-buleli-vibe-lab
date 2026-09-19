import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import { inertAuth, inertLearners, inertOwnedDerivedContent, inertOwnedGoals } from "./inert-auth.js"

describe("API — health", () => {
  it("returns ok without listening on a port", async () => {
    const app = await buildApp({ auth: inertAuth(), learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent() })
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: "ok" })
    await app.close()
  })
})
