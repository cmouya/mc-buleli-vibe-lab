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
import { memoryOwnedDerivedContent, memoryOwnedGoals } from "./inert-auth.js"

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

describe("API — owned Path / Step / Evidence", () => {
  it("authorizes descendants only through LearnerContext and owned Goal", async () => {
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
          return `tok-derived-${n}`
        },
      },
    }
    const app = await buildApp({ auth, learners, ownedGoals, ownedDerived })
    const adaCookie = await loginCookie(app, "ada@acme.test")
    const bobCookie = await loginCookie(app, "bob@acme.test")
    const eveCookie = await loginCookie(app, "eve@acme.test")
    const noLearnerCookie = await loginCookie(app, "nolearner@acme.test")

    const createdA = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${ada.organization.id}/goals`,
      headers: { cookie: adaCookie },
      payload,
    })
    expect(createdA.statusCode).toBe(200)
    const goalAId = createdA.json().id as string
    const createdB = await app.inject({
      method: "POST",
      url: `/api/v1/organizations/${bob.organization.id}/goals`,
      headers: { cookie: adaCookie },
      payload: { ...payload, statement: "Goal B" },
    })
    expect(createdB.statusCode).toBe(200)
    const goalBId = createdB.json().id as string

    ownedDerived.paths.push({
      id: "path-a",
      goalId: goalAId,
      title: "Path A",
      steps: [{ id: "step-a", position: 0, title: "Step A", description: "" }],
    })
    ownedDerived.paths.push({
      id: "path-b",
      goalId: goalBId,
      title: "Path B",
      steps: [{ id: "step-b", position: 0, title: "Step B", description: "" }],
    })
    ownedDerived.evidenceRows.push({
      id: "ev-a",
      stepId: "step-a",
      type: "quiz_attempt",
      score: 1,
      maxScore: 1,
      passed: true,
      answers: [],
      recordedAt: "2026-09-19T12:00:00.000Z",
    })

    const ownerPath = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/path`,
      headers: { cookie: adaCookie },
    })
    expect(ownerPath.statusCode).toBe(200)
    expect(ownerPath.json()).toMatchObject({ id: "path-a", goalId: goalAId })

    const ownerStep = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/steps/step-a`,
      headers: { cookie: adaCookie },
    })
    expect(ownerStep.statusCode).toBe(200)
    expect(ownerStep.json()).toMatchObject({ id: "step-a" })

    const ownerEvidence = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/evidence/ev-a`,
      headers: { cookie: adaCookie },
    })
    expect(ownerEvidence.statusCode).toBe(200)
    expect(ownerEvidence.json()).toMatchObject({ id: "ev-a" })

    const unauth = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/path`,
    })
    expect(unauth.statusCode).toBe(401)

    const noMembership = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/path`,
      headers: { cookie: bobCookie },
    })
    const membershipNoLearner = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/path`,
      headers: { cookie: noLearnerCookie },
    })
    expect(noMembership.statusCode).toBe(403)
    expect(membershipNoLearner.statusCode).toBe(403)
    expect(noMembership.json()).toEqual(membershipNoLearner.json())
    expect(noMembership.json()).toMatchObject({ code: "ORG_FORBIDDEN" })

    const unknownPath = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/00000000-0000-4000-8000-000000000000/path`,
      headers: { cookie: adaCookie },
    })
    const crossOrgPath = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalAId}/path`,
      headers: { cookie: bobCookie },
    })
    const wrongLearnerPath = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/path`,
      headers: { cookie: eveCookie },
    })
    ownedGoals.rows.push({
      id: "legacy-goal",
      statement: "Legacy",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "personnel",
      status: "draft",
    })
    ownedDerived.paths.push({
      id: "path-legacy",
      goalId: "legacy-goal",
      title: "Legacy path",
      steps: [{ id: "step-legacy", position: 0, title: "Legacy step", description: "" }],
    })
    ownedDerived.evidenceRows.push({
      id: "ev-legacy",
      stepId: "step-legacy",
      type: "quiz_attempt",
      score: 1,
      maxScore: 1,
      passed: true,
      answers: [],
      recordedAt: "2026-09-19T12:00:00.000Z",
    })
    const legacyPath = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/legacy-goal/path`,
      headers: { cookie: adaCookie },
    })
    expect(unknownPath.statusCode).toBe(404)
    expect(crossOrgPath.statusCode).toBe(404)
    expect(wrongLearnerPath.statusCode).toBe(404)
    expect(legacyPath.statusCode).toBe(404)
    expect(unknownPath.json()).toEqual(crossOrgPath.json())
    expect(wrongLearnerPath.json()).toEqual(unknownPath.json())
    expect(legacyPath.json()).toEqual(unknownPath.json())
    expect(unknownPath.json()).toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(JSON.stringify(unknownPath.json())).not.toMatch(/organizationId/)
    expect(JSON.stringify(unknownPath.json())).not.toMatch(/learnerId/)

    const forgedGoalStep = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalBId}/steps/step-a`,
      headers: { cookie: adaCookie },
    })
    const forgedGoalEvidence = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalBId}/evidence/ev-a`,
      headers: { cookie: adaCookie },
    })
    const crossOrgStep = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalAId}/steps/step-a`,
      headers: { cookie: bobCookie },
    })
    const crossOrgEvidence = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalAId}/evidence/ev-a`,
      headers: { cookie: bobCookie },
    })
    const legacyEvidence = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/legacy-goal/evidence/ev-legacy`,
      headers: { cookie: adaCookie },
    })
    expect(forgedGoalStep.statusCode).toBe(404)
    expect(forgedGoalEvidence.statusCode).toBe(404)
    expect(crossOrgStep.statusCode).toBe(404)
    expect(crossOrgEvidence.statusCode).toBe(404)
    expect(legacyEvidence.statusCode).toBe(404)
    expect(forgedGoalStep.json()).toEqual(unknownPath.json())
    expect(forgedGoalEvidence.json()).toEqual(unknownPath.json())
    expect(crossOrgStep.json()).toEqual(unknownPath.json())
    expect(crossOrgEvidence.json()).toEqual(unknownPath.json())
    expect(legacyEvidence.json()).toEqual(unknownPath.json())

    const forgedQuery = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalAId}/path?learnerId=forged&organizationId=${bob.organization.id}`,
      headers: {
        cookie: eveCookie,
        "x-learner-id": createdA.json().learnerId,
        "x-organization-id": ada.organization.id as string,
      },
    })
    expect(forgedQuery.statusCode).toBe(404)
    expect(forgedQuery.json()).toEqual(unknownPath.json())

    const aSeesOnlyA = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${ada.organization.id}/goals/${goalBId}/path`,
      headers: { cookie: adaCookie },
    })
    const bSeesOnlyB = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalAId}/path`,
      headers: { cookie: adaCookie },
    })
    const bOwner = await app.inject({
      method: "GET",
      url: `/api/v1/organizations/${bob.organization.id}/goals/${goalBId}/path`,
      headers: { cookie: adaCookie },
    })
    expect(aSeesOnlyA.statusCode).toBe(404)
    expect(bSeesOnlyB.statusCode).toBe(404)
    expect(bOwner.statusCode).toBe(200)
    expect(bOwner.json().id).toBe("path-b")

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
})
