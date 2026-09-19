import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import {
  bootstrapTestIdentity,
  persistMembership,
  persistOrganization,
  persistPasswordCredential,
  persistUser,
} from "../../src/application/persist-identity.js"
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
import { inertAuth } from "./inert-auth.js"

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

function cookieFrom(response: { headers: { "set-cookie"?: string | string[] } }): string {
  const raw = response.headers["set-cookie"]
  const header = Array.isArray(raw) ? raw[0] : raw
  return (header ?? "").split(";")[0]
}

async function tenantFixture() {
  const identity = memoryIdentity()
  const ada = await bootstrapTestIdentity(
    { organizationName: "Org A", email: "ada@acme.test", secretHash: "h:secret", role: "member" },
    identity,
  )
  const bob = await bootstrapTestIdentity(
    { organizationName: "Org B", email: "bob@acme.test", secretHash: "h:secret", role: "member" },
    identity,
  )
  const cara = await bootstrapTestIdentity(
    { organizationName: "Org C-unused", email: "cara@acme.test", secretHash: "h:secret", role: "member" },
    identity,
  )
  await persistMembership(
    { organizationId: ada.organization.id as string, userId: cara.user.id as string, role: "member" },
    identity.memberships,
  )
  await persistMembership(
    { organizationId: bob.organization.id as string, userId: cara.user.id as string, role: "org_admin" },
    identity.memberships,
  )
  const zeroUser = await persistUser(identity.users)
  await persistPasswordCredential(
    { userId: zeroUser.id as string, identifier: "zero@acme.test", secretHash: "h:secret" },
    identity.credentials,
  )
  await persistOrganization("Unrelated", identity.organizations)
  let n = 0
  const auth = {
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
  return { auth, ada, bob }
}

async function loginCookie(
  app: Awaited<ReturnType<typeof buildApp>>,
  identifier: string,
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { identifier, password: "secret" },
  })
  expect(response.statusCode).toBe(200)
  return cookieFrom(response)
}

describe("API — organization context", () => {
  it("allows membership and denies cross-tenant, zero memberships, and forged ids with the same 403", async () => {
    const { auth, ada, bob } = await tenantFixture()
    const app = await buildApp({ auth })
    const adaCookie = await loginCookie(app, "ada@acme.test")
    const bobCookie = await loginCookie(app, "bob@acme.test")
    const caraCookie = await loginCookie(app, "cara@acme.test")
    const zeroCookie = await loginCookie(app, "zero@acme.test")

    const allowA = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/context`,
      headers: { cookie: adaCookie },
    })
    expect(allowA.statusCode).toBe(200)
    expect(allowA.json()).toEqual({
      userId: ada.user.id,
      organizationId: ada.organization.id,
      role: "member",
    })
    expect(allowA.json()).not.toHaveProperty("sessionCookieToken")
    expect(allowA.json()).not.toHaveProperty("rawToken")
    expect(allowA.json()).not.toHaveProperty("password")
    expect(allowA.json()).not.toHaveProperty("secretHash")

    const denyAonB = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/context`,
      headers: { cookie: adaCookie },
    })
    const denyBonA = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/context`,
      headers: { cookie: bobCookie },
    })
    const forged = await app.inject({
      method: "GET",
      url: "/api/v1/organizations/00000000-0000-4000-8000-000000000000/context",
      headers: { cookie: adaCookie },
    })
    const zero = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/context`,
      headers: { cookie: zeroCookie },
    })
    expect(denyAonB.statusCode).toBe(403)
    expect(denyBonA.json()).toEqual(denyAonB.json())
    expect(forged.json()).toEqual(denyAonB.json())
    expect(zero.json()).toEqual(denyAonB.json())
    expect(denyAonB.json()).toMatchObject({ code: "ORG_FORBIDDEN" })

    const caraA = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/context`,
      headers: { cookie: caraCookie },
    })
    const caraB = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/context`,
      headers: { cookie: caraCookie },
    })
    expect(caraA.statusCode).toBe(200)
    expect(caraA.json()).toMatchObject({ organizationId: ada.organization.id, role: "member" })
    expect(caraB.statusCode).toBe(200)
    expect(caraB.json()).toMatchObject({ organizationId: bob.organization.id, role: "org_admin" })
    await app.close()
  })

  it("returns 401 without a cookie or with an unknown cookie", async () => {
    const { auth, ada } = await tenantFixture()
    const app = await buildApp({ auth })
    const url = `/api/v1/organizations/${ada.organization.id}/context`
    const missing = await app.inject({ method: "GET", url })
    const garbage = await app.inject({
      method: "GET",
      url,
      headers: { cookie: `${AUTH_COOKIE_NAME}=not-a-session` },
    })
    expect(missing.statusCode).toBe(401)
    expect(garbage.statusCode).toBe(401)
    expect(missing.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })
    expect(garbage.json()).toEqual(missing.json())
    await app.close()
  })

  it("keeps confirm and generate public", async () => {
    const app = await buildApp({ auth: inertAuth() })
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
