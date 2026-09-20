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
  memoryOwnedProgress,
  inertOwnedPaths,
} from "./inert-auth.js"

const NOW = "2026-09-20T00:00:00.000Z"
const GOAL_A = "11111111-1111-4111-8111-111111111111"
const GOAL_B = "22222222-2222-4222-8222-222222222222"
const GOAL_Z = "55555555-5555-4555-8555-555555555555"
const STEP_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const STEP_A2 = "aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const STEP_A3 = "aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const STEP_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const answers = [{ questionIndex: 0, selectedIndex: 1, correct: true }]

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

function progressUrl(organizationId: string, goalId: string) {
  return `/api/v1/organizations/${organizationId}/goals/${goalId}/path/progress`
}

function evidenceUrl(organizationId: string, goalId: string, stepId: string) {
  return `/api/v1/organizations/${organizationId}/goals/${goalId}/steps/${stepId}/evidence`
}

describe("API — owned Path Progress GET", () => {
  it("derives Progress through the trusted chain and fails closed without leaking", async () => {
    const identity = memoryIdentity()
    const learners = memoryLearners()
    const ownedGoals = memoryOwnedGoals()
    const ownedDerived = memoryOwnedDerivedContent(ownedGoals.rows)
    const ownedEvidence = memoryOwnedEvidence()
    const ownedProgress = memoryOwnedProgress(
      ownedGoals.rows,
      ownedDerived.paths,
      ownedEvidence.records,
    )
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
      confirmedOwned(GOAL_Z, ada.organization.id as string, adaLearnerA.id as string, "Zero steps"),
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
        steps: [
          { id: STEP_A, position: 0, title: "Quiz A", description: "" },
          { id: STEP_A2, position: 1, title: "Quiz A2", description: "" },
          { id: STEP_A3, position: 2, title: "Quiz A3", description: "" },
        ],
      },
      {
        id: "path-b",
        goalId: GOAL_B,
        title: "Path B",
        steps: [{ id: STEP_B, position: 0, title: "Quiz B", description: "" }],
      },
      {
        id: "path-z",
        goalId: GOAL_Z,
        title: "Empty path",
        steps: [],
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
          return `tok-owned-progress-${n}`
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
      ownedProgress,
    })
    const adaCookie = await loginCookie(app, "ada@acme.test")
    const bobCookie = await loginCookie(app, "bob@acme.test")
    const eveCookie = await loginCookie(app, "eve@acme.test")
    const noLearnerCookie = await loginCookie(app, "nolearner@acme.test")
    const learnerOnlyCookie = await loginCookie(app, "learneronly@acme.test")

    async function getProgress(organizationId: string, goalId: string, cookie: string) {
      return app.inject({
        method: "GET",
        url: progressUrl(organizationId, goalId),
        headers: { cookie },
      })
    }

    async function postEvidence(
      organizationId: string,
      goalId: string,
      stepId: string,
      cookie: string,
      passed: boolean,
    ) {
      return app.inject({
        method: "POST",
        url: evidenceUrl(organizationId, goalId, stepId),
        headers: { cookie },
        payload: { score: passed ? 2 : 1, maxScore: 2, passed, answers },
      })
    }

    const empty = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(empty.statusCode).toBe(200)
    expect(empty.json()).toEqual({ totalSteps: 3, completedSteps: 0, progressPercent: 0 })
    expect(empty.json()).not.toHaveProperty("currentStep")
    expect(empty.json()).not.toHaveProperty("evidence")
    expect(JSON.stringify(empty.json())).not.toMatch(/organizationId/)
    expect(JSON.stringify(empty.json())).not.toMatch(/learnerId/)

    const zero = await getProgress(ada.organization.id as string, GOAL_Z, adaCookie)
    expect(zero.statusCode).toBe(200)
    expect(zero.json()).toEqual({ totalSteps: 0, completedSteps: 0, progressPercent: 0 })

    expect(
      (await postEvidence(ada.organization.id as string, GOAL_A, STEP_A, adaCookie, false)).statusCode,
    ).toBe(200)
    const failedOnly = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(failedOnly.json()).toEqual({ totalSteps: 3, completedSteps: 0, progressPercent: 0 })

    expect(
      (await postEvidence(ada.organization.id as string, GOAL_A, STEP_A, adaCookie, true)).statusCode,
    ).toBe(200)
    const failedThenPassed = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(failedThenPassed.json()).toEqual({ totalSteps: 3, completedSteps: 1, progressPercent: 33 })

    expect(
      (await postEvidence(ada.organization.id as string, GOAL_A, STEP_A, adaCookie, false)).statusCode,
    ).toBe(200)
    const passedThenFailed = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(passedThenFailed.json()).toEqual({ totalSteps: 3, completedSteps: 1, progressPercent: 33 })

    expect(
      (await postEvidence(ada.organization.id as string, GOAL_A, STEP_A, adaCookie, true)).statusCode,
    ).toBe(200)
    const duplicatePassed = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(duplicatePassed.json()).toEqual({ totalSteps: 3, completedSteps: 1, progressPercent: 33 })

    expect(
      (await postEvidence(ada.organization.id as string, GOAL_A, STEP_A2, adaCookie, true)).statusCode,
    ).toBe(200)
    const mixed = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(mixed.json()).toEqual({ totalSteps: 3, completedSteps: 2, progressPercent: 67 })

    const beforeGet = ownedEvidence.records.length
    const pathCount = ownedDerived.paths.length
    const afterSuccessfulGet = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(afterSuccessfulGet.statusCode).toBe(200)
    expect(ownedEvidence.records).toHaveLength(beforeGet)
    expect(ownedDerived.paths).toHaveLength(pathCount)

    const unauth = await app.inject({
      method: "GET",
      url: progressUrl(ada.organization.id as string, GOAL_A),
    })
    expect(unauth.statusCode).toBe(401)
    expect(unauth.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED", message: "Not authenticated" })

    const noMembership = await getProgress(ada.organization.id as string, GOAL_A, bobCookie)
    const membershipNoLearner = await getProgress(ada.organization.id as string, GOAL_A, noLearnerCookie)
    const learnerNoMembership = await getProgress(ada.organization.id as string, GOAL_A, learnerOnlyCookie)
    expect(noMembership.statusCode).toBe(403)
    expect(membershipNoLearner.statusCode).toBe(403)
    expect(learnerNoMembership.statusCode).toBe(403)
    expect(noMembership.json()).toEqual(membershipNoLearner.json())
    expect(learnerNoMembership.json()).toEqual(noMembership.json())
    expect(noMembership.json()).toEqual({
      code: "ORG_FORBIDDEN",
      message: "Organization access denied",
    })

    const beforeDenied = ownedEvidence.records.length
    const crossOrg = await getProgress(bob.organization.id as string, GOAL_A, bobCookie)
    const wrongLearner = await getProgress(ada.organization.id as string, GOAL_A, eveCookie)
    const unknownGoal = await getProgress(
      ada.organization.id as string,
      "00000000-0000-4000-8000-000000000001",
      adaCookie,
    )
    const legacy = await getProgress(ada.organization.id as string, "legacy-goal", adaCookie)
    const aOnB = await getProgress(ada.organization.id as string, GOAL_B, adaCookie)
    const bOnA = await getProgress(bob.organization.id as string, GOAL_A, adaCookie)
    expect(crossOrg.statusCode).toBe(404)
    expect(wrongLearner.statusCode).toBe(404)
    expect(unknownGoal.statusCode).toBe(404)
    expect(legacy.statusCode).toBe(404)
    expect(aOnB.statusCode).toBe(404)
    expect(bOnA.statusCode).toBe(404)
    expect(crossOrg.json()).toEqual(unknownGoal.json())
    expect(wrongLearner.json()).toEqual(unknownGoal.json())
    expect(legacy.json()).toEqual(unknownGoal.json())
    expect(aOnB.json()).toEqual(unknownGoal.json())
    expect(bOnA.json()).toEqual(unknownGoal.json())
    expect(crossOrg.json()).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(JSON.stringify(crossOrg.json())).not.toMatch(/organizationId/)
    expect(JSON.stringify(crossOrg.json())).not.toMatch(/learnerId/)
    expect(ownedEvidence.records).toHaveLength(beforeDenied)

    const forgedQuery = await app.inject({
      method: "GET",
      url: `${progressUrl(ada.organization.id as string, GOAL_A)}?learnerId=${eveLearnerA.id}&organizationId=${bob.organization.id}&goalId=${GOAL_B}&stepId=${STEP_B}`,
      headers: { cookie: adaCookie },
    })
    expect(forgedQuery.statusCode).toBe(200)
    expect(forgedQuery.json()).toEqual({ totalSteps: 3, completedSteps: 2, progressPercent: 67 })

    const forgedHeaders = await app.inject({
      method: "GET",
      url: progressUrl(ada.organization.id as string, GOAL_A),
      headers: {
        cookie: adaCookie,
        "x-learner-id": eveLearnerA.id as string,
        "x-organization-id": bob.organization.id as string,
        "x-goal-id": GOAL_B,
        "x-step-id": STEP_B,
      },
    })
    expect(forgedHeaders.statusCode).toBe(200)
    expect(forgedHeaders.json()).toEqual({ totalSteps: 3, completedSteps: 2, progressPercent: 67 })

    expect(
      (await postEvidence(bob.organization.id as string, GOAL_B, STEP_B, adaCookie, true)).statusCode,
    ).toBe(200)
    const bOwner = await getProgress(bob.organization.id as string, GOAL_B, adaCookie)
    expect(bOwner.statusCode).toBe(200)
    expect(bOwner.json()).toEqual({ totalSteps: 1, completedSteps: 1, progressPercent: 100 })
    const stillA = await getProgress(ada.organization.id as string, GOAL_A, adaCookie)
    expect(stillA.json()).toEqual({ totalSteps: 3, completedSteps: 2, progressPercent: 67 })

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

  it("returns 401 for unknown cookie on owned Progress GET", async () => {
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
      ownedProgress: memoryOwnedProgress([], [], []),
    })
    const response = await app.inject({
      method: "GET",
      url: progressUrl(ada.organization.id as string, GOAL_A),
      headers: { cookie: `${AUTH_COOKIE_NAME}=not-a-session` },
    })
    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: "AUTH_UNAUTHENTICATED" })
    await app.close()
  })
})
