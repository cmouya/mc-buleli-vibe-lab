import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { persistLearner } from "../../../src/application/persist-learner.js"
import type { Learner, LearnerRepository } from "../../../src/modules/learner/index.js"

const NOW = "2026-09-13T00:00:00.000Z"

function memoryLearners(): LearnerRepository {
  const byOrgAndUser = new Map<string, Learner>()
  const key = (organizationId: string, userId: string) => `${organizationId}\0${userId}`
  return {
    async save(learner) {
      byOrgAndUser.set(key(learner.organizationId, learner.userId), learner)
      return learner
    },
    async getByOrganizationAndUserId(organizationId, userId) {
      return byOrgAndUser.get(key(organizationId, userId)) ?? null
    },
  }
}

describe("application — persistLearner", () => {
  it("creates and persists a Learner through the repository port", async () => {
    const repository = memoryLearners()
    const learner = await persistLearner(
      { organizationId: "org-1", userId: "user-1" },
      repository,
      { now: NOW },
    )
    expect(learner.id).toBeTruthy()
    expect(learner.organizationId).toBe("org-1")
    expect(learner.userId).toBe("user-1")
    expect(learner.createdAt).toBe(NOW)

    const found = await repository.getByOrganizationAndUserId("org-1", "user-1")
    expect(found).toEqual(learner)
  })

  it("scopes lookup by organization and user", async () => {
    const repository = memoryLearners()
    await persistLearner({ organizationId: "org-1", userId: "user-1", id: "lrn-a" }, repository, {
      now: NOW,
    })

    expect(await repository.getByOrganizationAndUserId("org-1", "user-2")).toBeNull()
    expect(await repository.getByOrganizationAndUserId("org-2", "user-1")).toBeNull()
    expect(await repository.getByOrganizationAndUserId("org-1", "user-1")).toMatchObject({
      id: "lrn-a",
    })
  })

  it("resolves the same userId independently under different organizationIds", async () => {
    const repository = memoryLearners()
    const first = await persistLearner(
      { organizationId: "org-a", userId: "shared-user", id: "lrn-a" },
      repository,
      { now: NOW },
    )
    const second = await persistLearner(
      { organizationId: "org-b", userId: "shared-user", id: "lrn-b" },
      repository,
      { now: NOW },
    )

    expect(first.id).toBe("lrn-a")
    expect(second.id).toBe("lrn-b")
    expect(await repository.getByOrganizationAndUserId("org-a", "shared-user")).toEqual(first)
    expect(await repository.getByOrganizationAndUserId("org-b", "shared-user")).toEqual(second)
  })

  it("keeps persistLearner free of infrastructure and server stacks", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/persist-learner.ts"),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
