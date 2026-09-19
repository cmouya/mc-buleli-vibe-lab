import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  createLearner,
  createLearnerState,
  type Learner,
} from "../../../src/modules/learner/index.js"

const NOW = "2026-09-13T00:00:00.000Z"

describe("learner domain — Learner (person)", () => {
  it("represents id, organizationId, userId, and createdAt", () => {
    const learner: Learner = createLearner(
      { id: "lrn-1", organizationId: "org-1", userId: "user-1" },
      { now: NOW },
    )
    expect(learner).toEqual({
      id: "lrn-1",
      organizationId: "org-1",
      userId: "user-1",
      createdAt: NOW,
    })
  })

  it("rejects empty organizationId and userId", () => {
    expect(() => createLearner({ organizationId: "  ", userId: "user-1" })).toThrow(DomainError)
    expect(() => createLearner({ organizationId: "org-1", userId: "  " })).toThrow(DomainError)
  })

  it("is distinct from LearnerState (not a session snapshot or membership role)", () => {
    const learner = createLearner({ organizationId: "org-1", userId: "user-1" }, { now: NOW })
    const state = createLearnerState({ learnerId: "lrn-1" })

    expect(learner).not.toHaveProperty("activeGoalId")
    expect(learner).not.toHaveProperty("pathId")
    expect(learner).not.toHaveProperty("role")
    expect(state).not.toHaveProperty("organizationId")
    expect(state).not.toHaveProperty("userId")
    expect(state).not.toHaveProperty("createdAt")
  })

  it("keeps the Learner domain free of infrastructure and server stacks", () => {
    const dir = join(dirname(fileURLToPath(import.meta.url)), "../../../src/modules/learner")
    for (const file of ["learner.ts", "learner-repository.ts"]) {
      const source = readFileSync(join(dir, file), "utf8")
      expect(source, file).not.toMatch(/drizzle-orm/)
      expect(source, file).not.toMatch(/fastify/i)
      expect(source, file).not.toMatch(/from ["']\.\.\/infra\//)
      expect(source, file).not.toMatch(/from ["']\.\.\/server\//)
    }
  })
})
