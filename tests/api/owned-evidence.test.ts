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
import {
  memoryOwnedGoals,
  memoryOwnedDerivedContent,
  memoryOwnedEvidence,
  inertOwnedPaths,
} from "./inert-auth.js"

const NOW = "2026-09-19T20:00:00.000Z"
const GOAL_A = "11111111-1111-4111-8111-111111111111"
const GOAL_B = "22222222-2222-4222-8222-222222222222"
const STEP_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const STEP_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const answers = [{ questionIndex: 0, selectedIndex: 1, correct: true }]
const payload = {
  score: 1,
  maxScore: 2,
  passed: false,
  answers,
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

function evidenceUrl(organizationId: string, goalId: string, stepId: string) {
  return `/api/v1/organizations/${organizationId}/goals/${goalId}/steps/${stepId}/evidence`
}

describe("API — owned Evidence POST", () => {
  it("persists through the trusted chain and fails closed without leaking", async () => {
    const identity = memoryIdentity()
    const learners = memoryLearners()
    const ownedGoals = memoryOwnedGoals()
    const ownedDerived = memoryOwnedDerivedContent(ownedGoals.rows)
    const ownedEvidence = memoryOwnedEvidence()
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

    ownedGoals.rows.push(
      confirmedOwned(GOAL_A, ada.organization.id as string, adaLearnerA.id as string, "Goal A"),
      confirmedOwned(GOAL_B, bob.organization.id as string, adaLearnerB.id as string, "Goal B"),
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
    ownedDerived.paths.push(
      {
        id: "path-a",
        goalId: GOAL_A,
        title: "Path A",
        steps: [{ id: STEP_A, position: 0, title: "Quiz A", description: "" }],
      },
      {
        id: "path-b",
        goalId: GOAL_B,
        title: "Path B",
        steps: [{ id: STEP_B, position: 0, title: "Quiz B", description: "" }],
      },
      {
        id: "path-legacy",
        goalId: "legacy-goal",
        title: "Legacy path",
        steps: [{ id: "legacy-step", position: 0, title: "Legacy quiz", description: "" }],
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
          return `tok-owned-evidence-${n}`
        },
      },
    }
    const app = await buildApp({
      auth,
      learners,
      ownedGoals,
      ownedDerived,
      ownedPaths: inertOwnedPaths(),
      ownedEvidence,
    })
    const adaCookie = await loginCookie(app, "ada@acme.test")
    const bobCookie = await loginCookie(app, "bob@acme.test")
    const eveCookie = await loginCookie(app, "eve@acme.test")
    const noLearnerCookie = await loginCookie(app, "nolearner@acme.test")
    const learnerOnlyCookie = await loginCookie(app, "learneronly@acme.test")

    const created = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: adaCookie },
      payload,
    })
    expect(created.statusCode).toBe(200)
    expect(created.json().stepId).toBe(STEP_A)
    expect(created.json().type).toBe("quiz_attempt")
    expect(created.json().score).toBe(1)
    expect(created.json().maxScore).toBe(2)
    expect(created.json().passed).toBe(false)
    expect(created.json().answers).toEqual(answers)
    expect(created.json().id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(created.json().recordedAt).toBeTruthy()
    expect(ownedEvidence.records).toHaveLength(1)
    expect(ownedEvidence.lastScope).toEqual({
      organizationId: ada.organization.id,
      learnerId: adaLearnerA.id,
    })
    expect(ownedEvidence.lastGoalId).toBe(GOAL_A)

    const unauth = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      payload,
    })
    expect(unauth.statusCode).toBe(401)
    expect(unauth.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })

    const noMembership = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: bobCookie },
      payload,
    })
    const membershipNoLearner = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: noLearnerCookie },
      payload,
    })
    const learnerNoMembership = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: learnerOnlyCookie },
      payload,
    })
    expect(noMembership.statusCode).toBe(403)
    expect(membershipNoLearner.statusCode).toBe(403)
    expect(learnerNoMembership.statusCode).toBe(403)
    expect(noMembership.json()).toEqual(membershipNoLearner.json())
    expect(learnerNoMembership.json()).toEqual(noMembership.json())
    expect(noMembership.json()).toMatchObject({ code: "ORG_FORBIDDEN" })

    const beforeDenied = ownedEvidence.records.length
    const crossOrg = await app.inject({
      method: "POST",
      url: evidenceUrl(bob.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: bobCookie },
      payload,
    })
    const wrongLearner = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: eveCookie },
      payload,
    })
    const wrongGoal = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_B),
      headers: { cookie: adaCookie },
      payload,
    })
    const unknownStep = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, "00000000-0000-4000-8000-000000000000"),
      headers: { cookie: adaCookie },
      payload,
    })
    const unknownGoal = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, "00000000-0000-4000-8000-000000000001", STEP_A),
      headers: { cookie: adaCookie },
      payload,
    })
    const legacy = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, "legacy-goal", "legacy-step"),
      headers: { cookie: adaCookie },
      payload,
    })
    expect(crossOrg.statusCode).toBe(404)
    expect(wrongLearner.statusCode).toBe(404)
    expect(wrongGoal.statusCode).toBe(404)
    expect(unknownStep.statusCode).toBe(404)
    expect(unknownGoal.statusCode).toBe(404)
    expect(legacy.statusCode).toBe(404)
    expect(crossOrg.json()).toEqual(unknownStep.json())
    expect(wrongLearner.json()).toEqual(unknownStep.json())
    expect(wrongGoal.json()).toEqual(unknownStep.json())
    expect(unknownGoal.json()).toEqual(unknownStep.json())
    expect(legacy.json()).toEqual(unknownStep.json())
    expect(crossOrg.json()).toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(JSON.stringify(crossOrg.json())).not.toMatch(/organizationId/)
    expect(JSON.stringify(crossOrg.json())).not.toMatch(/learnerId/)
    expect(ownedEvidence.records).toHaveLength(beforeDenied)

    const forged = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: {
        cookie: adaCookie,
        "x-learner-id": eveLearnerA.id as string,
        "x-organization-id": bob.organization.id as string,
        "x-goal-id": GOAL_B,
        "x-step-id": STEP_B,
      },
      payload: {
        ...payload,
        organizationId: bob.organization.id,
        learnerId: eveLearnerA.id,
        goalId: GOAL_B,
        stepId: STEP_B,
        type: "submission",
        id: "forged-id",
        recordedAt: "1999-01-01T00:00:00.000Z",
      },
    })
    expect(forged.statusCode).toBe(200)
    expect(forged.json().stepId).toBe(STEP_A)
    expect(forged.json().stepId).not.toBe(STEP_B)
    expect(forged.json().type).toBe("quiz_attempt")
    expect(forged.json().id).not.toBe("forged-id")
    expect(forged.json().recordedAt).not.toBe("1999-01-01T00:00:00.000Z")
    expect(ownedEvidence.lastScope).toEqual({
      organizationId: ada.organization.id,
      learnerId: adaLearnerA.id,
    })
    expect(ownedEvidence.lastGoalId).toBe(GOAL_A)

    const forgedQuery = await app.inject({
      method: "POST",
      url: `${evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A)}?learnerId=${eveLearnerA.id}&organizationId=${bob.organization.id}&goalId=${GOAL_B}&stepId=${STEP_B}`,
      headers: { cookie: adaCookie },
      payload,
    })
    expect(forgedQuery.statusCode).toBe(200)
    expect(forgedQuery.json().stepId).toBe(STEP_A)
    expect(ownedEvidence.lastGoalId).toBe(GOAL_A)

    const aOnB = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_B, STEP_B),
      headers: { cookie: adaCookie },
      payload,
    })
    const bOnA = await app.inject({
      method: "POST",
      url: evidenceUrl(bob.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: adaCookie },
      payload,
    })
    expect(aOnB.statusCode).toBe(404)
    expect(bOnA.statusCode).toBe(404)
    expect(aOnB.json()).toEqual(unknownStep.json())
    const bOwner = await app.inject({
      method: "POST",
      url: evidenceUrl(bob.organization.id as string, GOAL_B, STEP_B),
      headers: { cookie: adaCookie },
      payload,
    })
    expect(bOwner.statusCode).toBe(200)
    expect(bOwner.json().stepId).toBe(STEP_B)
    expect(ownedEvidence.lastScope).toEqual({
      organizationId: bob.organization.id,
      learnerId: adaLearnerB.id,
    })
    expect(ownedEvidence.lastGoalId).toBe(GOAL_B)

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

  it("returns 401 for unknown cookie on owned Evidence POST", async () => {
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
      ownedDerived: memoryOwnedDerivedContent([]),
      ownedPaths: inertOwnedPaths(),
      ownedEvidence: memoryOwnedEvidence(),
    })
    const response = await app.inject({
      method: "POST",
      url: evidenceUrl(ada.organization.id as string, GOAL_A, STEP_A),
      headers: { cookie: `${AUTH_COOKIE_NAME}=not-a-session` },
      payload,
    })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })
    await app.close()
  })
})
