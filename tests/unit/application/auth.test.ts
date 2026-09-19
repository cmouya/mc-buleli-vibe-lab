import { describe, expect, it } from "vitest"
import { login } from "../../../src/application/login.js"
import { logout } from "../../../src/application/logout.js"
import { resolveSession } from "../../../src/application/resolve-session.js"
import { bootstrapTestIdentity } from "../../../src/application/persist-identity.js"
import type {
  IdentityRepositories,
  OrganizationMembershipRepository,
  OrganizationRepository,
  UserCredentialRepository,
  UserRepository,
} from "../../../src/application/persist-identity.js"
import type { AuthSession, SessionRepository } from "../../../src/modules/auth/index.js"
import type {
  IdentityUser,
  Organization,
  OrganizationMembership,
  UserCredential,
} from "../../../src/modules/identity/index.js"
import { DomainError } from "../../../src/modules/shared/index.js"
import { createArgon2idPasswordHasher } from "../../../src/infra/crypto/password-hasher.js"

function memoryIdentity(): IdentityRepositories {
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
  return { organizations, users, credentials, memberships }
}

function memorySessions(): SessionRepository {
  const rows = new Map<string, AuthSession>()
  return {
    async save(item) {
      rows.set(item.tokenHash, item)
      return item
    },
    async getByTokenHash(tokenHash) {
      return rows.get(tokenHash) ?? null
    },
    async revokeByTokenHash(tokenHash, revokedAt) {
      const current = rows.get(tokenHash)
      if (current) {
        rows.set(tokenHash, { ...current, revokedAt })
      }
    },
  }
}

const hasher = {
  async hash() {
    throw new Error("login must not hash passwords")
  },
  async verify(secretHash: string, password: string) {
    return secretHash === `h:${password}`
  },
  dummyHash() {
    return "h:dummy"
  },
  needsRehash() {
    return false
  },
}

const digest = {
  digest(raw: string) {
    return `sha:${raw}`
  },
}

describe("application — login logout resolveSession", () => {
  it("logs in with normalized identifier and returns memberships without secrets", async () => {
    const identity = memoryIdentity()
    await bootstrapTestIdentity(
      {
        organizationName: "Acme",
        email: "Ada@Acme.TEST",
        secretHash: "h:secret",
        role: "member",
      },
      identity,
    )
    let issued = 0
    const result = await login(
      { identifier: "  ADA@acme.test  ", password: "secret" },
      {
        ...identity,
        sessions: memorySessions(),
        hasher,
        digest,
        tokens: {
          issue() {
            issued += 1
            return `tok-${issued}`
          },
        },
      },
    )
    expect(result.sessionCookieToken).toBe("tok-1")
    expect(result.context.memberships).toEqual([
      expect.objectContaining({ role: "member" }),
    ])
    expect(result.context).not.toHaveProperty("sessionCookieToken")
    expect(result.context).not.toHaveProperty("rawToken")
    expect(JSON.stringify(result.context)).not.toMatch(/secretHash|password|tok-1/)
  })

  it("rejects unknown identifier with the same error as a bad password", async () => {
    const identity = memoryIdentity()
    const sessions = memorySessions()
    const deps = {
      ...identity,
      sessions,
      hasher,
      digest,
      tokens: { issue: () => "tok" },
    }
    await expect(login({ identifier: "missing@x.test", password: "secret" }, deps)).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
    })
  })

  it("rejects a stored malformed hash with the same generic credentials error", async () => {
    const identity = memoryIdentity()
    await bootstrapTestIdentity(
      {
        organizationName: "Acme",
        email: "legacy@acme.test",
        secretHash: "not-argon2id",
        role: "member",
      },
      identity,
    )
    const argon = createArgon2idPasswordHasher()
    const deps = {
      ...identity,
      sessions: memorySessions(),
      hasher: argon,
      digest,
      tokens: { issue: () => "tok" },
    }
    await expect(login({ identifier: "legacy@acme.test", password: "secret" }, deps)).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
    })
  })

  it("resolves then rejects after logout", async () => {
    const identity = memoryIdentity()
    await bootstrapTestIdentity(
      {
        organizationName: "Acme",
        email: "ada@acme.test",
        secretHash: "h:secret",
        role: "org_admin",
      },
      identity,
    )
    const sessions = memorySessions()
    const deps = {
      ...identity,
      sessions,
      hasher,
      digest,
      tokens: { issue: () => "tok-live" },
    }
    const logged = await login({ identifier: "ada@acme.test", password: "secret" }, deps)
    const context = await resolveSession(logged.sessionCookieToken, deps)
    expect(context.userId).toBe(logged.context.userId)
    expect(context).not.toHaveProperty("sessionCookieToken")
    expect(context).not.toHaveProperty("rawToken")
    await logout(logged.sessionCookieToken, deps)
    await expect(resolveSession(logged.sessionCookieToken, deps)).rejects.toBeInstanceOf(DomainError)
  })

  it("rejects an unknown token and an expired session as unauthenticated", async () => {
    const identity = memoryIdentity()
    await bootstrapTestIdentity(
      {
        organizationName: "Acme",
        email: "ada@acme.test",
        secretHash: "h:secret",
        role: "member",
      },
      identity,
    )
    const deps = {
      ...identity,
      sessions: memorySessions(),
      hasher,
      digest,
      tokens: { issue: () => "tok-ttl" },
    }
    await expect(resolveSession("garbage-token", deps)).rejects.toMatchObject({
      code: "AUTH_UNAUTHENTICATED",
    })
    const logged = await login(
      { identifier: "ada@acme.test", password: "secret" },
      deps,
      { now: "2026-09-13T00:00:00.000Z" },
    )
    await expect(
      resolveSession(logged.sessionCookieToken, deps, { now: "2026-09-15T00:00:00.000Z" }),
    ).rejects.toMatchObject({ code: "AUTH_UNAUTHENTICATED" })
  })
})
