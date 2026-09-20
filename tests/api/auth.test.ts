import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import { bootstrapTestIdentity } from "../../src/application/persist-identity.js"
import type {
  IdentityRepositories,
  OrganizationMembershipRepository,
  OrganizationRepository,
  UserCredentialRepository,
  UserRepository,
} from "../../src/application/persist-identity.js"
import type { AuthSession, SessionRepository } from "../../src/modules/auth/index.js"
import type {
  IdentityUser,
  Organization,
  OrganizationMembership,
  UserCredential,
} from "../../src/modules/identity/index.js"
import { AUTH_COOKIE_NAME } from "../../src/server/auth-cookie.js"
import { createArgon2idPasswordHasher } from "../../src/infra/crypto/password-hasher.js"
import { inertAuth, inertLearners, inertOwnedDerivedContent, inertOwnedEvidence, inertOwnedGoals, inertOwnedPaths, inertOwnedProgress } from "./inert-auth.js"

function memoryIdentity(): IdentityRepositories {
  const orgs = new Map<string, Organization>()
  const userRows = new Map<string, IdentityUser>()
  const creds = new Map<string, UserCredential>()
  const mems = new Map<string, OrganizationMembership>()
  return {
    organizations: {
      async save(item) {
        orgs.set(item.id as string, item)
        return item
      },
      async getById(id) {
        return orgs.get(id) ?? null
      },
    } satisfies OrganizationRepository,
    users: {
      async save(item) {
        userRows.set(item.id as string, item)
        return item
      },
      async getById(id) {
        return userRows.get(id) ?? null
      },
    } satisfies UserRepository,
    credentials: {
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
    } satisfies UserCredentialRepository,
    memberships: {
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
    } satisfies OrganizationMembershipRepository,
  }
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

async function seededAuth() {
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
  let n = 0
  return {
    ...identity,
    sessions: memorySessions(),
    hasher,
    digest,
    tokens: {
      issue() {
        n += 1
        return `tok-${n}`
      },
    },
  }
}

function cookieFrom(response: { headers: { "set-cookie"?: string | string[] } }): string {
  const raw = response.headers["set-cookie"]
  const header = Array.isArray(raw) ? raw[0] : raw
  return header ?? ""
}

describe("API — auth session cookie", () => {
  it("logs in with HttpOnly learnova.sid and does not leak secrets", async () => {
    const auth = await seededAuth()
    const app = await buildApp({ auth, learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(), ownedProgress: inertOwnedProgress() })
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "ada@acme.test", password: "secret", organizationId: "forged" },
    })
    expect(response.statusCode).toBe(200)
    const body = response.json() as Record<string, unknown>
    expect(body).toHaveProperty("userId")
    expect(body).toHaveProperty("memberships")
    expect(body).not.toHaveProperty("sessionCookieToken")
    expect(body).not.toHaveProperty("rawToken")
    expect(body).not.toHaveProperty("password")
    expect(body).not.toHaveProperty("secretHash")
    const setCookie = cookieFrom(response)
    expect(setCookie).toContain(`${AUTH_COOKIE_NAME}=`)
    expect(setCookie.toLowerCase()).toContain("httponly")
    expect(setCookie.toLowerCase()).toContain("samesite=lax")
    await app.close()
  })

  it("rejects invalid login with 401 and resolves then logout", async () => {
    const auth = await seededAuth()
    const app = await buildApp({ auth, learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(), ownedProgress: inertOwnedProgress() })
    const bad = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "ada@acme.test", password: "wrong" },
    })
    expect(bad.statusCode).toBe(401)
    expect(bad.json()).toMatchObject({ code: "AUTH_INVALID_CREDENTIALS" })

    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "ada@acme.test", password: "secret" },
    })
    const cookieHeader = cookieFrom(login)
    const session = await app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: { cookie: cookieHeader.split(";")[0] },
    })
    expect(session.statusCode).toBe(200)
    expect(session.json()).not.toHaveProperty("sessionCookieToken")
    expect(session.json()).not.toHaveProperty("rawToken")

    const loggedOut = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: cookieHeader.split(";")[0] },
    })
    expect(loggedOut.statusCode).toBe(204)
    const after = await app.inject({
      method: "GET",
      url: "/api/v1/auth/session",
      headers: { cookie: cookieHeader.split(";")[0] },
    })
    expect(after.statusCode).toBe(401)
    await app.close()
  })

  it("rate-limits login after 10 attempts", async () => {
    const auth = await seededAuth()
    const app = await buildApp({ auth, learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(), ownedProgress: inertOwnedProgress() })
    let lastStatus = 0
    for (let i = 0; i < 11; i += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        remoteAddress: "127.0.0.1",
        payload: { identifier: "ada@acme.test", password: "wrong" },
      })
      lastStatus = response.statusCode
    }
    expect(lastStatus).toBe(429)
    await app.close()
  })

  it("returns generic 401 when the stored secret_hash is not Argon2id", async () => {
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
    const app = await buildApp({
      auth: {
        ...identity,
        sessions: memorySessions(),
        hasher: createArgon2idPasswordHasher(),
        digest,
        tokens: { issue: () => "tok" },
      },
      learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(), ownedProgress: inertOwnedProgress(),
    })
    const missing = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "missing@acme.test", password: "secret" },
    })
    const malformed = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "legacy@acme.test", password: "secret" },
    })
    expect(malformed.statusCode).toBe(401)
    expect(malformed.json()).toEqual(missing.json())
    expect(malformed.json()).toMatchObject({ code: "AUTH_INVALID_CREDENTIALS" })
    expect(malformed.json()).not.toHaveProperty("secretHash")
    await app.close()
  })

  it("registers auth routes even when callers only need public M4 routes", async () => {
    const app = await buildApp({ auth: inertAuth(), learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(), ownedProgress: inertOwnedProgress() })
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { identifier: "anyone@acme.test", password: "secret" },
    })
    expect(login.statusCode).toBe(401)
    expect(login.statusCode).not.toBe(404)
    await app.close()
  })

  it("keeps confirm and generate public", async () => {
    const app = await buildApp({ auth: inertAuth(), learners: inertLearners(), ownedGoals: inertOwnedGoals(), ownedDerived: inertOwnedDerivedContent(), ownedPaths: inertOwnedPaths(), ownedEvidence: inertOwnedEvidence(), ownedProgress: inertOwnedProgress() })
    const confirm = await app.inject({
      method: "POST",
      url: "/api/v1/goals/confirm",
      payload: {
        goal: "Maîtriser Outlook",
        level: "debutant",
        hoursPerWeek: 5,
        intent: "professionnel",
        analyzed: true,
      },
    })
    expect(confirm.statusCode).toBe(200)
    await app.close()
  })
})
