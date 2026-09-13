import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  bootstrapTestIdentity,
  persistMembership,
  persistOrganization,
  type IdentityRepositories,
  type OrganizationMembershipRepository,
  type OrganizationRepository,
  type UserCredentialRepository,
  type UserRepository,
} from "../../../src/application/persist-identity.js"
import type {
  IdentityUser,
  Organization,
  OrganizationMembership,
  UserCredential,
} from "../../../src/modules/identity/index.js"

function memoryRepos(): IdentityRepositories {
  const orgs = new Map<string, Organization>()
  const userRows = new Map<string, IdentityUser>()
  const creds = new Map<string, UserCredential>()
  const mems = new Map<string, OrganizationMembership>()
  const organizations: OrganizationRepository = {
    async save(item) {
      orgs.set(item.id as string, item)
      return item
    },
    async getById(id) {
      return orgs.get(id) ?? null
    },
  }
  const users: UserRepository = {
    async save(item) {
      userRows.set(item.id as string, item)
      return item
    },
    async getById(id) {
      return userRows.get(id) ?? null
    },
  }
  const credentials: UserCredentialRepository = {
    async save(item) {
      creds.set(item.id as string, item)
      return item
    },
    async getById(id) {
      return creds.get(id) ?? null
    },
    async getByTypeAndIdentifier(type, identifier) {
      return (
        [...creds.values()].find((item) => item.type === type && item.identifier === identifier) ??
        null
      )
    },
  }
  const memberships: OrganizationMembershipRepository = {
    async save(item) {
      mems.set(item.id as string, item)
      return item
    },
    async getById(id) {
      return mems.get(id) ?? null
    },
    async listByUserId(userId) {
      return [...mems.values()].filter((item) => item.userId === userId)
    },
  }
  return {
    organizations,
    users,
    credentials,
    memberships,
  }
}

describe("application — persist identity", () => {
  it("assigns UUIDs and bootstraps a controlled identity", async () => {
    const repos = memoryRepos()
    const result = await bootstrapTestIdentity(
      {
        organizationName: "Acme",
        email: "ada@acme.test",
        secretHash: "test-hash",
        role: "org_admin",
      },
      repos,
    )
    expect(result.organization.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(result.user.id).toBeTruthy()
    expect(result.credential.identifier).toBe("ada@acme.test")
    expect(result.membership.role).toBe("org_admin")
  })

  it("allows a second membership for the same user in another org", async () => {
    const repos = memoryRepos()
    const first = await bootstrapTestIdentity(
      {
        organizationName: "Acme",
        email: "ada@acme.test",
        secretHash: "test-hash",
        role: "member",
      },
      repos,
    )
    const other = await persistOrganization("Beta", repos.organizations)
    await persistMembership(
      {
        organizationId: other.id as string,
        userId: first.user.id as string,
        role: "member",
      },
      repos.memberships,
    )
    const listed = await repos.memberships.listByUserId(first.user.id as string)
    expect(listed).toHaveLength(2)
  })

  it("does not implement sessions or attach identity repos to submitAssessment", () => {
    const persistSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/persist-identity.ts"),
      "utf8",
    )
    const submitSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/submit-assessment.ts"),
      "utf8",
    )
    expect(persistSource).not.toMatch(/function login/)
    expect(persistSource).not.toMatch(/cookie/i)
    expect(submitSource).not.toMatch(/IdentityRepositories/)
    expect(submitSource).not.toMatch(/OrganizationRepository/)
  })
})
