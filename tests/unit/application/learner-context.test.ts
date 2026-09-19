import { describe, expect, it } from "vitest"
import { resolveLearnerContext } from "../../../src/application/resolve-learner-context.js"
import { resolveOrganizationContext } from "../../../src/application/resolve-organization-context.js"
import type { AuthContext } from "../../../src/application/resolve-session.js"
import type { Learner, LearnerRepository } from "../../../src/modules/learner/index.js"
import { DomainError } from "../../../src/modules/shared/index.js"

function auth(overrides?: Partial<AuthContext>): AuthContext {
  return {
    sessionId: "sess-1",
    userId: "user-u",
    memberships: [{ organizationId: "org-a", role: "member" }],
    expiresAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  }
}

function memoryLearners(rows: Learner[] = []): LearnerRepository & { saves: Learner[] } {
  const byKey = new Map(rows.map((row) => [`${row.organizationId}\0${row.userId}`, row]))
  const saves: Learner[] = []
  return {
    saves,
    async save(learner) {
      saves.push(learner)
      byKey.set(`${learner.organizationId}\0${learner.userId}`, learner)
      return learner
    },
    async getByOrganizationAndUserId(organizationId, userId) {
      return byKey.get(`${organizationId}\0${userId}`) ?? null
    },
  }
}

describe("application — resolveLearnerContext", () => {
  it("resolves LearnerContext from OrganizationContext + organization/user lookup", async () => {
    const organization = resolveOrganizationContext(auth(), "org-a")
    const repository = memoryLearners([
      { id: "lrn-a", organizationId: "org-a", userId: "user-u", createdAt: "2026-09-13T00:00:00.000Z" },
    ])
    await expect(resolveLearnerContext(organization, repository)).resolves.toEqual({
      learnerId: "lrn-a",
      userId: "user-u",
      organizationId: "org-a",
    })
  })

  it("resolves distinct Learners for the same user in two organizations", async () => {
    const multi = auth({
      memberships: [
        { organizationId: "org-a", role: "member" },
        { organizationId: "org-b", role: "org_admin" },
      ],
    })
    const repository = memoryLearners([
      { id: "lrn-a", organizationId: "org-a", userId: "user-u", createdAt: "2026-09-13T00:00:00.000Z" },
      { id: "lrn-b", organizationId: "org-b", userId: "user-u", createdAt: "2026-09-13T00:00:00.000Z" },
    ])
    const contextA = await resolveLearnerContext(resolveOrganizationContext(multi, "org-a"), repository)
    const contextB = await resolveLearnerContext(resolveOrganizationContext(multi, "org-b"), repository)
    expect(contextA.learnerId).toBe("lrn-a")
    expect(contextB.learnerId).toBe("lrn-b")
    expect(contextA.learnerId).not.toBe(contextB.learnerId)
  })

  it("fails closed when membership exists but no Learner, without creating a row", async () => {
    const organization = resolveOrganizationContext(auth(), "org-a")
    const repository = memoryLearners()
    await expect(resolveLearnerContext(organization, repository)).rejects.toMatchObject({
      code: "ORG_FORBIDDEN",
    })
    expect(repository.saves).toEqual([])
  })

  it("does not treat a Learner in another organization as authorization", () => {
    const onlyA = auth()
    expect(() => resolveOrganizationContext(onlyA, "org-b")).toThrow(DomainError)
    try {
      resolveOrganizationContext(onlyA, "org-b")
    } catch (error) {
      expect(error).toMatchObject({ code: "ORG_FORBIDDEN" })
    }
  })

  it("does not fall back to a Learner from another organization", async () => {
    const organization = resolveOrganizationContext(auth(), "org-a")
    const repository = memoryLearners([
      { id: "lrn-b", organizationId: "org-b", userId: "user-u", createdAt: "2026-09-13T00:00:00.000Z" },
    ])
    await expect(resolveLearnerContext(organization, repository)).rejects.toMatchObject({
      code: "ORG_FORBIDDEN",
    })
  })
})
