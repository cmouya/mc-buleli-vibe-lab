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
import type { Goal } from "../../src/modules/goals/index.js"
import { AUTH_COOKIE_NAME } from "../../src/server/auth-cookie.js"
import { memoryOwnedGoals, memoryOwnedPaths, inertOwnedDerivedContent, inertOwnedEvidence, inertOwnedProgress } from "./inert-auth.js"

const NOW = "2026-09-12T16:00:00.000Z"
const proposal = {
  pathId: "ia-pro",
  pathTitle: "IA pour développer votre activité",
  summary: "proposal",
  steps: [
    { id: "ia-1", title: "Fondamentaux", description: "Bases" },
    { id: "ia-2", title: "ChatGPT", description: "" },
  ],
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

function confirmedOwned(
  id: string,
  organizationId: string,
  learnerId: string,
  statement: string,
): Goal {
  return {
    id,
    statement,
    level: "debutant",
    hoursPerWeek: 5,
    intent: "professionnel",
    status: "confirmed",
    analyzedAt: NOW,
    confirmedAt: NOW,
    organizationId,
    learnerId,
  }
}

describe("API — owned Path POST", () => {
  it("persists through the trusted chain and fails closed without leaking", async () => {
    const identity = memoryIdentity()
    const learners = memoryLearners()
    const ownedGoals = memoryOwnedGoals()
    const ownedPaths = memoryOwnedPaths()
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
    const adaLearnerA = await persistLearner(
      { organizationId: ada.organization.id as string, userId: ada.user.id as string },
      learners,
    )
    const adaLearnerB = await persistLearner(
      { organizationId: bob.organization.id as string, userId: ada.user.id as string },
      learners,
    )
    const bobLearnerB = await persistLearner(
      { organizationId: bob.organization.id as string, userId: bob.user.id as string },
      learners,
    )
    const eveLearnerA = await persistLearner(
      { organizationId: ada.organization.id as string, userId: eve.user.id as string },
      learners,
    )
    await persistLearner(
      { organizationId: ada.organization.id as string, userId: learnerOnly.id as string },
      learners,
    )

    const goalAId = "11111111-1111-4111-8111-111111111111"
    const goalBId = "22222222-2222-4222-8222-222222222222"
    ownedGoals.rows.push(
      confirmedOwned(goalAId, ada.organization.id as string, adaLearnerA.id as string, "Goal A"),
      confirmedOwned(goalBId, bob.organization.id as string, adaLearnerB.id as string, "Goal B"),
      confirmedOwned(
        "33333333-3333-4333-8333-333333333333",
        bob.organization.id as string,
        bobLearnerB.id as string,
        "Bob goal",
      ),
      confirmedOwned(
        "44444444-4444-4444-8444-444444444444",
        ada.organization.id as string,
        eveLearnerA.id as string,
        "Eve goal",
      ),
      {
        id: "legacy-goal",
        statement: "Legacy",
        level: "debutant",
        hoursPerWeek: 4,
        intent: "personnel",
        status: "confirmed",
        analyzedAt: NOW,
        confirmedAt: NOW,
      },
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
          return `tok-owned-path-${n}`
        },
      },
    }
    const app = await buildApp({
      auth,
      learners,
      ownedGoals,
      ownedDerived: inertOwnedDerivedContent(),
      ownedPaths,
      ownedEvidence: inertOwnedEvidence(),
      ownedProgress: inertOwnedProgress(),
    })
    const adaCookie = await loginCookie(app, "ada@acme.test")
    const bobCookie = await loginCookie(app, "bob@acme.test")
    const eveCookie = await loginCookie(app, "eve@acme.test")
    const noLearnerCookie = await loginCookie(app, "nolearner@acme.test")
    const learnerOnlyCookie = await loginCookie(app, "learneronly@acme.test")

    const pathUrl = (organizationId: string, goalId: string) =>
      `/api/v1/organizations/${organizationId}/goals/${goalId}/path`

    const created = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      headers: { cookie: adaCookie },
      payload: proposal,
    })
    expect(created.statusCode).toBe(200)
    expect(created.json().goalId).toBe(goalAId)
    expect(created.json().title).toBe(proposal.pathTitle)
    expect(created.json().steps).toHaveLength(2)
    expect(created.json().steps[0].title).toBe("Fondamentaux")
    expect(ownedPaths.records).toHaveLength(1)
    expect(ownedPaths.lastScope).toEqual({
      organizationId: ada.organization.id,
      learnerId: adaLearnerA.id,
    })

    const unauth = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      payload: proposal,
    })
    expect(unauth.statusCode).toBe(401)
    expect(unauth.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })

    const noMembership = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      headers: { cookie: bobCookie },
      payload: proposal,
    })
    const membershipNoLearner = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      headers: { cookie: noLearnerCookie },
      payload: proposal,
    })
    const learnerNoMembership = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      headers: { cookie: learnerOnlyCookie },
      payload: proposal,
    })
    expect(noMembership.statusCode).toBe(403)
    expect(membershipNoLearner.statusCode).toBe(403)
    expect(learnerNoMembership.statusCode).toBe(403)
    expect(noMembership.json()).toEqual(membershipNoLearner.json())
    expect(learnerNoMembership.json()).toEqual(noMembership.json())
    expect(noMembership.json()).toMatchObject({ code: "ORG_FORBIDDEN" })

    const beforeDenied = ownedPaths.records.length
    const crossOrg = await app.inject({
      method: "POST",
      url: pathUrl(bob.organization.id as string, goalAId),
      headers: { cookie: bobCookie },
      payload: proposal,
    })
    const wrongLearner = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      headers: { cookie: eveCookie },
      payload: proposal,
    })
    const unknown = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, "00000000-0000-4000-8000-000000000000"),
      headers: { cookie: adaCookie },
      payload: proposal,
    })
    const legacy = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, "legacy-goal"),
      headers: { cookie: adaCookie },
      payload: proposal,
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
    expect(ownedPaths.records).toHaveLength(beforeDenied)

    const forged = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalAId),
      headers: {
        cookie: adaCookie,
        "x-learner-id": eveLearnerA.id as string,
        "x-organization-id": bob.organization.id as string,
      },
      payload: {
        ...proposal,
        organizationId: bob.organization.id,
        learnerId: eveLearnerA.id,
        goalId: goalBId,
      },
    })
    expect(forged.statusCode).toBe(200)
    expect(forged.json().goalId).toBe(goalAId)
    expect(forged.json().goalId).not.toBe(goalBId)
    expect(ownedPaths.lastScope).toEqual({
      organizationId: ada.organization.id,
      learnerId: adaLearnerA.id,
    })

    const forgedQuery = await app.inject({
      method: "POST",
      url: `${pathUrl(ada.organization.id as string, goalAId)}?learnerId=${eveLearnerA.id}&organizationId=${bob.organization.id}`,
      headers: { cookie: adaCookie },
      payload: proposal,
    })
    expect(forgedQuery.statusCode).toBe(200)
    expect(forgedQuery.json().goalId).toBe(goalAId)

    const aOnB = await app.inject({
      method: "POST",
      url: pathUrl(ada.organization.id as string, goalBId),
      headers: { cookie: adaCookie },
      payload: proposal,
    })
    const bOnA = await app.inject({
      method: "POST",
      url: pathUrl(bob.organization.id as string, goalAId),
      headers: { cookie: adaCookie },
      payload: proposal,
    })
    expect(aOnB.statusCode).toBe(404)
    expect(bOnA.statusCode).toBe(404)
    expect(aOnB.json()).toEqual(unknown.json())
    const bOwner = await app.inject({
      method: "POST",
      url: pathUrl(bob.organization.id as string, goalBId),
      headers: { cookie: adaCookie },
      payload: proposal,
    })
    expect(bOwner.statusCode).toBe(200)
    expect(bOwner.json().goalId).toBe(goalBId)
    expect(ownedPaths.lastScope).toEqual({
      organizationId: bob.organization.id,
      learnerId: adaLearnerB.id,
    })

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
    const publicGenerate = await app.inject({
      method: "POST",
      url: "/api/v1/paths/generate",
      payload: {
        goal: "Maîtriser Outlook",
        level: "debutant",
        hoursPerWeek: 5,
        intent: "professionnel",
      },
    })
    expect(publicConfirm.statusCode).toBe(200)
    expect(publicGenerate.statusCode).toBe(200)
    await app.close()
  })

  it("returns 401 for unknown cookie on owned Path POST", async () => {
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
      ownedPaths: memoryOwnedPaths(),
      ownedEvidence: inertOwnedEvidence(),
      ownedProgress: inertOwnedProgress(),
    })
    const response = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${ada.organization.id}/goals/anything/path`,
      headers: { cookie: `${AUTH_COOKIE_NAME}=not-a-session` },
      payload: proposal,
    })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })
    await app.close()
  })
})
