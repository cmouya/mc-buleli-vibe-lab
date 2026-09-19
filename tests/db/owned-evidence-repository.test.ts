import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { DomainError } from "../../src/modules/shared/index.js"
import { confirmGoal, createGoal, markGoalAnalyzed } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import { recordQuizEvidence } from "../../src/modules/evidence/index.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import {
  createDb,
  createDrizzleEvidenceRepository,
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleLearningPathRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedEvidenceRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-19T20:00:00.000Z"
const fields = {
  statement: "Owned evidence goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function acceptedPath(goalId: string): AcceptedLearningPath {
  return {
    id: randomUUID(),
    goalId,
    title: "Path",
    steps: [
      {
        id: randomUUID(),
        position: 0,
        title: "Quiz",
        description: "",
      },
    ],
  }
}

function scored(stepId: string, extra?: { id?: string; score?: number; passed?: boolean }) {
  return recordQuizEvidence(
    {
      id: extra?.id ?? randomUUID(),
      stepId,
      score: extra?.score ?? 1,
      maxScore: 2,
      passed: extra?.passed ?? false,
      answers: [{ questionIndex: 0, selectedIndex: 1, correct: true }],
    },
    { now: NOW },
  )
}

describe("M6.3 C2 — Owned Evidence repository (PostgreSQL)", () => {
  it("persists Evidence only after Step→Path→Goal ownership proof and fails closed otherwise", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const ownedGoals = createDrizzleOwnedGoalRepository(db)
      const ownedPaths = createDrizzleOwnedLearningPathRepository(db)
      const ownedEvidence = createDrizzleOwnedEvidenceRepository(db)
      const legacyGoals = createDrizzleGoalRepository(db)
      const legacyPaths = createDrizzleLearningPathRepository(db)
      const legacyEvidence = createDrizzleEvidenceRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }))
      const userU = await users.save(createUser({ id: randomUUID() }))
      const userTwo = await users.save(createUser({ id: randomUUID() }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userU.id as string,
        }),
      )
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: userU.id as string,
        }),
      )
      const learnerA2 = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userTwo.id as string,
        }),
      )

      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: userU.id as string,
        organizationId: orgA.id as string,
      }
      const contextB: LearnerContext = {
        learnerId: learnerB.id as string,
        userId: userU.id as string,
        organizationId: orgB.id as string,
      }
      const contextA2: LearnerContext = {
        learnerId: learnerA2.id as string,
        userId: userTwo.id as string,
        organizationId: orgA.id as string,
      }
      const scopeA = { organizationId: contextA.organizationId, learnerId: contextA.learnerId }
      const scopeB = { organizationId: contextB.organizationId, learnerId: contextB.learnerId }
      const scopeA2 = { organizationId: contextA2.organizationId, learnerId: contextA2.learnerId }

      const goalA = await persistOwnedGoal({ ...fields, statement: "GA" }, contextA, ownedGoals)
      const goalB = await persistOwnedGoal({ ...fields, statement: "GB" }, contextB, ownedGoals)
      const pathA = await ownedPaths.saveOwned(acceptedPath(goalA.id as string), scopeA)
      const pathB = await ownedPaths.saveOwned(acceptedPath(goalB.id as string), scopeB)
      const stepA = pathA.steps[0]!.id
      const stepB = pathB.steps[0]!.id

      const savedA = await ownedEvidence.saveOwned(scored(stepA, { score: 1 }), scopeA, goalA.id as string)
      expect(savedA.stepId).toBe(stepA)
      expect(savedA.type).toBe("quiz_attempt")
      expect(savedA.score).toBe(1)
      expect(savedA.maxScore).toBe(2)
      expect(savedA.passed).toBe(false)
      expect(savedA.answers).toEqual([{ questionIndex: 0, selectedIndex: 1, correct: true }])
      expect(savedA.recordedAt).toBe(NOW)
      expect(savedA.id).toBeDefined()

      const savedB = await ownedEvidence.saveOwned(scored(stepB, { score: 2, passed: true }), scopeB, goalB.id as string)
      expect(savedB.stepId).toBe(stepB)
      expect(savedB.passed).toBe(true)

      const deniedWrongGoal = scored(stepA)
      const deniedCrossOrg = scored(stepA)
      const deniedWrongLearner = scored(stepA)
      const deniedUnknownStep = scored(randomUUID())
      const deniedUnknownGoal = scored(stepA)
      const deniedScopeAOnB = scored(stepB)
      const deniedScopeBOnA = scored(stepA)

      await expect(
        ownedEvidence.saveOwned(deniedWrongGoal, scopeA, goalB.id as string),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
      await expect(ownedEvidence.saveOwned(deniedCrossOrg, scopeB, goalA.id as string)).rejects.toMatchObject({
        code: "RESOURCE_NOT_FOUND",
        message: "Not found",
      })
      await expect(ownedEvidence.saveOwned(deniedWrongLearner, scopeA2, goalA.id as string)).rejects.toMatchObject({
        code: "RESOURCE_NOT_FOUND",
        message: "Not found",
      })
      const unknownStepFailure = ownedEvidence.saveOwned(deniedUnknownStep, scopeA, goalA.id as string)
      const unknownGoalFailure = ownedEvidence.saveOwned(deniedUnknownGoal, scopeA, randomUUID())
      await expect(unknownStepFailure).rejects.toMatchObject({
        code: "RESOURCE_NOT_FOUND",
        message: "Not found",
      })
      await expect(unknownGoalFailure).rejects.toMatchObject({
        code: "RESOURCE_NOT_FOUND",
        message: "Not found",
      })
      await expect(ownedEvidence.saveOwned(deniedScopeAOnB, scopeA, goalB.id as string)).rejects.toBeInstanceOf(
        DomainError,
      )
      await expect(ownedEvidence.saveOwned(deniedScopeBOnA, scopeB, goalA.id as string)).rejects.toBeInstanceOf(
        DomainError,
      )

      for (const item of [
        deniedWrongGoal,
        deniedCrossOrg,
        deniedWrongLearner,
        deniedUnknownStep,
        deniedUnknownGoal,
        deniedScopeAOnB,
        deniedScopeBOnA,
      ]) {
        const [{ count }] = await client<[{ count: number }]>`
          SELECT count(*)::int AS "count" FROM evidence WHERE id = ${item.id as string}::uuid
        `
        expect(count).toBe(0)
      }

      const legacy = await legacyGoals.save(
        confirmGoal(
          markGoalAnalyzed(
            createGoal({
              statement: "Legacy unowned",
              level: "debutant",
              hoursPerWeek: 3,
              intent: "personnel",
              id: randomUUID(),
            }),
            { now: NOW },
          ),
          { now: NOW },
        ),
      )
      const legacyPath = await legacyPaths.save(acceptedPath(legacy.id as string))
      const legacyStep = legacyPath.steps[0]!.id
      const deniedLegacy = scored(legacyStep)
      await expect(
        ownedEvidence.saveOwned(deniedLegacy, scopeA, legacy.id as string),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
      const [{ countLegacy }] = await client<[{ countLegacy: number }]>`
        SELECT count(*)::int AS "countLegacy" FROM evidence WHERE id = ${deniedLegacy.id as string}::uuid
      `
      expect(countLegacy).toBe(0)

      const fromLegacy = await legacyEvidence.save(scored(legacyStep, { score: 0 }))
      expect(fromLegacy.stepId).toBe(legacyStep)
      expect(fromLegacy.passed).toBe(false)
      expect(await legacyEvidence.getById(fromLegacy.id as string)).toEqual(fromLegacy)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("authorizes saveOwned with Step→Path→Goal keys, not global getById", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/infra/db/owned-evidence-repository.ts",
      ),
      "utf8",
    )
    expect(source).toMatch(/eq\(learningPathSteps\.id, item\.stepId\)/)
    expect(source).toMatch(/eq\(learningPaths\.goalId, goalId\)/)
    expect(source).toMatch(/eq\(goals\.id, goalId\)/)
    expect(source).toMatch(/eq\(goals\.organizationId, scope\.organizationId\)/)
    expect(source).toMatch(/eq\(goals\.learnerId, scope\.learnerId\)/)
    expect(source).toMatch(/authorizedStepId/)
    expect(source).toMatch(/db\.transaction/)
    expect(source).not.toMatch(/createDrizzleEvidenceRepository/)
    expect(source).not.toMatch(/getById\(/)
    expect(source).not.toMatch(/organization_id/)
    expect(source).not.toMatch(/learner_id/)
  })
})
