import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import { inertAuth, inertLearners, inertOwnedDerivedContent, inertOwnedGoals } from "./inert-auth.js"

describe("API — GET /api/v1/openapi.json", () => {
  it("serves OpenAPI 3 describing health, confirm-goal, and generate-path", async () => {
    const app = await buildApp({
      auth: inertAuth(),
      learners: inertLearners(),
      ownedGoals: inertOwnedGoals(),
      ownedDerived: inertOwnedDerivedContent(),
      pathGenerator: {
        async generatePath() {
          return { pathId: "x", pathTitle: "x", steps: [] }
        },
      },
    })
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/openapi.json",
    })
    expect(response.statusCode).toBe(200)
    const spec = response.json() as {
      openapi: string
      paths: Record<string, unknown>
    }
    expect(spec.openapi.startsWith("3.")).toBe(true)
    expect(spec.paths).toHaveProperty("/api/v1/health")
    expect(spec.paths).toHaveProperty("/api/v1/goals/confirm")
    expect(spec.paths).toHaveProperty("/api/v1/paths/generate")
    expect(spec.paths).toHaveProperty("/api/v1/auth/login")
    expect(spec.paths).toHaveProperty("/api/v1/auth/logout")
    expect(spec.paths).toHaveProperty("/api/v1/auth/session")
    expect(spec.paths).toHaveProperty("/api/v1/organizations/{organizationId}/context")
    expect(spec.paths).toHaveProperty("/api/v1/organizations/{organizationId}/learner-context")
    expect(spec.paths).toHaveProperty("/api/v1/organizations/{organizationId}/goals")
    expect(spec.paths).toHaveProperty("/api/v1/organizations/{organizationId}/goals/{goalId}")
    expect(spec.paths).toHaveProperty("/api/v1/organizations/{organizationId}/goals/{goalId}/path")
    expect(spec.paths).toHaveProperty(
      "/api/v1/organizations/{organizationId}/goals/{goalId}/steps/{stepId}",
    )
    expect(spec.paths).toHaveProperty(
      "/api/v1/organizations/{organizationId}/goals/{goalId}/evidence/{evidenceId}",
    )
    expect(spec.paths).not.toHaveProperty("/api/v1/openapi.json")
    await app.close()
  })
})
