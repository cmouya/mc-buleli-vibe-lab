import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"

describe("API — GET /api/v1/openapi.json", () => {
  it("serves OpenAPI 3 describing health and confirm-goal", async () => {
    const app = await buildApp()
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
    expect(spec.paths).not.toHaveProperty("/api/v1/openapi.json")
    await app.close()
  })
})
