import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { buildApp } from "../../src/server/app.js"
import type { GeneratedPath, PathGenerator, PathGeneratorInput } from "../../src/application/index.js"

const generateBody: PathGeneratorInput = {
  goal: "Maîtriser Outlook",
  level: "debutant",
  hoursPerWeek: 5,
  intent: "professionnel",
}

const PROPOSAL: GeneratedPath = {
  pathId: "stub-path",
  pathTitle: "Stub GPS",
  summary: "proposal only",
  steps: [{ id: "s1", title: "Step 1", skill: "Outlook" }],
}

function stubGenerator(overrides?: Partial<PathGenerator>): PathGenerator {
  return {
    async generatePath() {
      return PROPOSAL
    },
    ...overrides,
  }
}

describe("API — POST /api/v1/paths/generate", () => {
  it("returns a path proposal from the injected PathGenerator", async () => {
    const calls: PathGeneratorInput[] = []
    const app = await buildApp({
      pathGenerator: {
        async generatePath(input) {
          calls.push(input)
          return PROPOSAL
        },
      },
    })
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paths/generate",
      payload: generateBody,
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(PROPOSAL)
    expect(calls).toEqual([generateBody])
    await app.close()
  })

  it("rejects a malformed body with 400", async () => {
    const app = await buildApp({ pathGenerator: stubGenerator() })
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paths/generate",
      payload: { goal: "" },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: "VALIDATION_ERROR" })
    await app.close()
  })

  it("maps generator failure to 500 INTERNAL_ERROR", async () => {
    const app = await buildApp({
      pathGenerator: {
        async generatePath() {
          throw new Error("generator-failed")
        },
      },
    })
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/paths/generate",
      payload: generateBody,
    })
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    })
    await app.close()
  })

  it("does not reimplement Goal-before-Path or bind a path", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../src/server/routes/v1/paths.ts"),
      "utf8",
    )
    expect(source).not.toMatch(/assertGoalReadyForPath/)
    expect(source).not.toMatch(/setPath/)
    expect(source).not.toMatch(/confirmGoal/)
    expect(source).not.toMatch(/MockAIService/)
  })
})
