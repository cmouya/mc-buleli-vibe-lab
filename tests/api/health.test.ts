import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"

describe("API — health", () => {
  it("returns ok without listening on a port", async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: "ok" })
    await app.close()
  })
})
