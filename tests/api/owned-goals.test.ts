import { describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import {
  bootstrapTestIdentity,
  persistMembership,
  persistPasswordCredential,
  persistUser,
} from "../../src/application/persist-identity.js"
import { persistLearner } from "../../src/application/persist-learner.js"
import type {
  IdentityRepositories,
  OrganizationMembershipRepository,
  OrganizationRepository,
  UserCredentialRepository,
  UserRepository,
} from "../../src/application/persist-identity.js"
import type { Learner, LearnerRepository } from "../../src/modules/learner/index.js"
import type { AuthSession, SessionRepository } from "../../src/modules/auth/index.js"
import type {
  IdentityUser,
  Organization,
  OrganizationMembership,
  UserCredential,
} from "../../src/modules/identity/index.js"
import { AUTH_COOKIE_NAME } from "../../src/server/auth-cookie.js"
import { memoryOwnedDerivedContent, memoryOwnedGoals, inertOwnedDerivedContent } from "./inert-auth.js"

const payload = {
  statement: "Maîtriser Outlook",
  level: "debutant",
  hoursPerWeek: 5,
  intent: "professionnel",
}

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

function memoryLearners(): LearnerRepository {
  const rows = new Map<string, Learner>()
  return {
    async save(item) {
      rows.set(`${item.organizationId}\0${item.userId}`, item)
      return item
    },
    async getByOrganizationAndUserId(organizationId, userId) {
      return rows.get(`${organizationId}\0${userId}`) ?? null
    },
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

async function loginCookie(app: Awaited<ReturnType<typeof buildApp>>, identifier: string) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { identifier, password: "secret" },
  })
  expect(response.statusCode).toBe(200)
  return cookieFrom(response)
}

describe("API — owned Goal HTTP", () => {
  it("creates and reads owned Goals through the trusted chain and fails closed without leaking", async () => {
    const identity = memoryIdentity()
    const learners = memoryLearners()
    const ownedGoals = memoryOwnedGoals()
    const ownedDerived = memoryOwnedDerivedContent(ownedGoals.rows)
    const ada = await bootstrapTestIdentity(
      { organizationName: "Org A", email: "ada@acme.test", secretHash: "h:secret", role: "member" },
      identity,
    )
    const bob = await bootstrapTestIdentity(
      { organizationName: "Org B", email: "bob@acme.test", secretHash: "h:secret", role: "member" },
      identity,
    )
    const eve = await bootstrapTestIdentity(
      { organizationName: "Org E-unused", email: "eve@acme.test", secretHash: "h:secret", role: "member" },
      identity,
    )
    await persistMembership(
      { organizationId: ada.organization.id as string, userId: eve.user.id as string, role: "member" },
      identity.memberships,
    )
    await persistMembership(
      { organizationId: bob.organization.id as string, userId: ada.user.id as string, role: "member" },
      identity.memberships,
    )
    const memberNoLearner = await persistUser(identity.users)
    await persistPasswordCredential(
      {
        userId: memberNoLearner.id as string,
        identifier: "nolearner@acme.test",
        secretHash: "h:secret",
      },
      identity.credentials,
    )
    await persistMembership(
      { organizationId: ada.organization.id as string, userId: memberNoLearner.id as string, role: "member" },
      identity.memberships,
    )
    const learnerOnly = await persistUser(identity.users)
    await persistPasswordCredential(
      {
        userId: learnerOnly.id as string,
        identifier: "learneronly@acme.test",
        secretHash: "h:secret",
      },
      identity.credentials,
    )
    await persistLearner(
      { organizationId: ada.organization.id as string, userId: learnerOnly.id as string },
      learners,
    )
    await persistLearner(
      { organizationId: ada.organization.id as string, userId: ada.user.id as string },
      learners,
    )
    await persistLearner(
      { organizationId: bob.organization.id as string, userId: ada.user.id as string },
      learners,
    )
    await persistLearner(
      { organizationId: bob.organization.id as string, userId: bob.user.id as string },
      learners,
    )
    await persistLearner(
      { organizationId: ada.organization.id as string, userId: eve.user.id as string },
      learners,
    )
    let n = 0
    const auth = {
      ...identity,
      sessions: memorySessions(),
      hasher,
      digest,
      tokens: {
        issue() {
          n += 1
          return `tok-owned-${n}`
        },
      },
    }
    const app = await buildApp({ auth, learners, ownedGoals, ownedDerived })
    const adaCookie = await loginCookie(app, "ada@acme.test")
    const bobCookie = await loginCookie(app, "bob@acme.test")
    const eveCookie = await loginCookie(app, "eve@acme.test")
    const noLearnerCookie = await loginCookie(app, "nolearner@acme.test")
    const learnerOnlyCookie = await loginCookie(app, "learneronly@acme.test")

    const createdA = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${ada.organization.id}/goals`,
      headers: { cookie: adaCookie },
      payload,
    })
    expect(createdA.statusCode).toBe(200)
    expect(createdA.json()).toMatchObject({
      statement: payload.statement,
      organizationId: ada.organization.id,
      learnerId: expect.any(String),
    })
    expect(createdA.json().learnerId).not.toBe(bob.user.id)
    const goalAId = createdA.json().id as string

    const forgedFields = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${ada.organization.id}/goals`,
      headers: { cookie: adaCookie },
      payload: {
        ...payload,
        organizationId: bob.organization.id,
        learnerId: "forged-learner",
      },
    })
    expect(forgedFields.statusCode).toBe(200)
    expect(forgedFields.json().organizationId).toBe(ada.organization.id)
    expect(forgedFields.json().learnerId).toBe(createdA.json().learnerId)
    expect(forgedFields.json().learnerId).not.toBe("forged-learner")
    expect(forgedFields.json().organizationId).not.toBe(bob.organization.id)

    const createdB = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${bob.organization.id}/goals`,
      headers: { cookie: adaCookie },
      payload: { ...payload, statement: "Goal B" },
    })
    expect(createdB.statusCode).toBe(200)
    expect(createdB.json().organizationId).toBe(bob.organization.id)
    expect(createdB.json().id).not.toBe(goalAId)
    const goalBId = createdB.json().id as string

    const ownerGet = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}`,
      headers: { cookie: adaCookie },
    })
    expect(ownerGet.statusCode).toBe(200)
    expect(ownerGet.json().id).toBe(goalAId)

    const unauthPost = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${ada.organization.id}/goals`,
      payload,
    })
    const unauthGet = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}`,
    })
    expect(unauthPost.statusCode).toBe(401)
    expect(unauthGet.statusCode).toBe(401)

    const noMembership = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}`,
      headers: { cookie: bobCookie },
    })
    const membershipNoLearner = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${ada.organization.id}/goals`,
      headers: { cookie: noLearnerCookie },
      payload,
    })
    const learnerNoMembership = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}`,
      headers: { cookie: learnerOnlyCookie },
    })
    expect(noMembership.statusCode).toBe(403)
    expect(membershipNoLearner.statusCode).toBe(403)
    expect(learnerNoMembership.statusCode).toBe(403)
    expect(noMembership.json()).toEqual(membershipNoLearner.json())
    expect(learnerNoMembership.json()).toEqual(noMembership.json())
    expect(noMembership.json()).toMatchObject({ code: "ORG_FORBIDDEN" })

    const crossOrg = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalAId}`,
      headers: { cookie: bobCookie },
    })
    const wrongLearner = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}`,
      headers: { cookie: eveCookie },
    })
    const unknown = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/00000000-0000-4000-8000-000000000000`,
      headers: { cookie: adaCookie },
    })
    ownedGoals.rows.push({
      id: "legacy-goal",
      statement: "Legacy",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "personnel",
      status: "draft",
    })
    const legacy = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/legacy-goal`,
      headers: { cookie: adaCookie },
    })
    expect(crossOrg.statusCode).toBe(404)
    expect(wrongLearner.statusCode).toBe(404)
    expect(unknown.statusCode).toBe(404)
    expect(legacy.statusCode).toBe(404)
    expect(crossOrg.json()).toEqual(unknown.json())
    expect(wrongLearner.json()).toEqual(unknown.json())
    expect(legacy.json()).toEqual(unknown.json())
    expect(crossOrg.json()).toMatchObject({ code: "GOAL_NOT_FOUND", message: "Goal not found" })
    expect(JSON.stringify(crossOrg.json())).not.toMatch(/organizationId/)
    expect(JSON.stringify(crossOrg.json())).not.toMatch(/learnerId/)
    expect(JSON.stringify(crossOrg.json())).not.toContain(ada.organization.id as string)

    const forgedQuery = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}?learnerId=forged&organizationId=${bob.organization.id}`,
      headers: { cookie: eveCookie, "x-learner-id": createdA.json().learnerId },
    })
    expect(forgedQuery.statusCode).toBe(404)
    expect(forgedQuery.json()).toEqual(unknown.json())

    const aSeesOnlyA = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalBId}`,
      headers: { cookie: adaCookie },
    })
    const bSeesOnlyB = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalAId}`,
      headers: { cookie: adaCookie },
    })
    expect(aSeesOnlyA.statusCode).toBe(404)
    expect(bSeesOnlyB.statusCode).toBe(404)
    const bOwner = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalBId}`,
      headers: { cookie: adaCookie },
    })
    expect(bOwner.statusCode).toBe(200)
    expect(bOwner.json().id).toBe(goalBId)

    const publicConfirm = await app.inject({
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
    expect(publicConfirm.statusCode).toBe(200)
    await app.close()
  })

  it("returns 401 for unknown cookie on owned Goal routes", async () => {
    const identity = memoryIdentity()
    const ada = await bootstrapTestIdentity(
      { organizationName: "Org A", email: "ada@acme.test", secretHash: "h:secret", role: "member" },
      identity,
    )
    const app = await buildApp({
      auth: {
        ...identity,
        sessions: memorySessions(),
        hasher,
        digest,
        tokens: { issue: () => "tok" },
      },
      learners: memoryLearners(),
      ownedGoals: memoryOwnedGoals(),
      ownedDerived: inertOwnedDerivedContent(),
    })
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/anything`,
      headers: { cookie: `${AUTH_COOKIE_NAME}=not-a-session` },
    })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })
    await app.close()
  })
})
