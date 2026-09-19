import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import { inertAuth, inertLearners, inertOwnedDerivedContent, inertOwnedEvidence, inertOwnedGoals, inertOwnedPaths } from "./inert-auth.js"

describe("API — GET /api/v1/openapi.json", () => {
  it("serves OpenAPI 3 describing health, confirm-goal, and generate-path", async () => {
    const app = await buildApp({
      auth: inertAuth(),
      learners: inertLearners(),
      ownedGoals: inertOwnedGoals(),
      ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(),
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
    const ownedPath = spec.paths["/api/v1/organizations/{organizationId}/goals/{goalId}/path"] as {
      get?: unknown
      post?: unknown
    }
    expect(ownedPath).toHaveProperty("get")
    expect(ownedPath).toHaveProperty("post")
    expect(spec.paths).toHaveProperty(
      "/api/v1/organizations/{organizationId}/goals/{goalId}/steps/{stepId}",
    )
    const ownedStepEvidence = spec.paths[
      "/api/v1/organizations/{organizationId}/goals/{goalId}/steps/{stepId}/evidence"
    ] as { post?: unknown }
    expect(ownedStepEvidence).toHaveProperty("post")
    expect(spec.paths).toHaveProperty(
      "/api/v1/organizations/{organizationId}/goals/{goalId}/evidence/{evidenceId}",
    )
    expect(spec.paths).not.toHaveProperty("/api/v1/openapi.json")
    await app.close()
  })
})
