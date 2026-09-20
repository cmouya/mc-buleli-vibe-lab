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
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleLearningPathRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedEvidenceRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleOwnedProgressRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-20T00:00:00.000Z"
const fields = {
  statement: "Owned progress goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function acceptedPath(goalId: string, titles = ["Quiz"]): AcceptedLearningPath {
  return {
    id: randomUUID(),
    goalId,
    title: "Path",
    steps: titles.map((title, position) => ({
      id: randomUUID(),
      position,
      title,
      description: "",
    })),
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

describe("M6.4 C2 — Owned Progress repository (PostgreSQL)", () => {
  it("lists Evidence only after Step→Path→Goal ownership proof and fails closed otherwise", async () => {
    const url = requireDatabaseUrl()
    expect(url).toMatch(/:5433\//)
    expect(url).not.toMatch(/:5432\//)
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
      const ownedProgress = createDrizzleOwnedProgressRepository(db)
      const legacyGoals = createDrizzleGoalRepository(db)
      const legacyPaths = createDrizzleLearningPathRepository(db)

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
      const scopeA = { organizationId: contextA.organizationId, learnerId: contextA.learnerId }
      const scopeB = { organizationId: contextB.organizationId, learnerId: contextB.learnerId }
      const scopeA2 = {
        organizationId: learnerA2.organizationId as string,
        learnerId: learnerA2.id as string,
      }

      const goalA = await persistOwnedGoal({ ...fields, statement: "GA" }, contextA, ownedGoals)
      const goalB = await persistOwnedGoal({ ...fields, statement: "GB" }, contextB, ownedGoals)
      const pathA = await ownedPaths.saveOwned(
        acceptedPath(goalA.id as string, ["Quiz A", "Quiz extra"]),
        scopeA,
      )
      const pathB = await ownedPaths.saveOwned(acceptedPath(goalB.id as string), scopeB)
      const stepA = pathA.steps[0]!.id
      const stepExtra = pathA.steps[1]!.id
      const stepB = pathB.steps[0]!.id

      expect(await ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeA)).toEqual(
        [],
      )

      const failedA = await ownedEvidence.saveOwned(scored(stepA, { passed: false }), scopeA, goalA.id as string)
      const failedOnly = await ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeA)
      expect(failedOnly).toHaveLength(1)
      expect(failedOnly[0]?.id).toBe(failedA.id)
      expect(failedOnly[0]?.passed).toBe(false)

      const passedA = await ownedEvidence.saveOwned(
        scored(stepA, { passed: true, score: 2 }),
        scopeA,
        goalA.id as string,
      )
      const mixedA = await ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeA)
      expect(mixedA.map((item) => item.id).sort()).toEqual([failedA.id, passedA.id].sort())
      expect(mixedA.some((item) => item.passed)).toBe(true)
      expect(mixedA.some((item) => !item.passed)).toBe(true)

      const extra = await ownedEvidence.saveOwned(scored(stepExtra, { passed: true }), scopeA, goalA.id as string)
      const onlyStepA = await ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeA)
      expect(onlyStepA.map((item) => item.id)).not.toContain(extra.id)

      const passedB = await ownedEvidence.saveOwned(
        scored(stepB, { passed: true, score: 2 }),
        scopeB,
        goalB.id as string,
      )
      const listedB = await ownedProgress.listOwnedEvidenceForStep(stepB, goalB.id as string, scopeB)
      expect(listedB).toHaveLength(1)
      expect(listedB[0]?.id).toBe(passedB.id)
      expect(listedB.map((item) => item.id)).not.toContain(failedA.id)

      const [{ evidenceCountBefore }] = await client<[{ evidenceCountBefore: number }]>`
        SELECT count(*)::int AS "evidenceCountBefore" FROM evidence
      `

      const notFound = { code: "RESOURCE_NOT_FOUND", message: "Not found" }
      await expect(
        ownedProgress.listOwnedEvidenceForStep(stepA, goalB.id as string, scopeA),
      ).rejects.toMatchObject(notFound)
      await expect(
        ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeB),
      ).rejects.toMatchObject(notFound)
      await expect(
        ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeA2),
      ).rejects.toMatchObject(notFound)
      await expect(
        ownedProgress.listOwnedEvidenceForStep(randomUUID(), goalA.id as string, scopeA),
      ).rejects.toMatchObject(notFound)
      await expect(
        ownedProgress.listOwnedEvidenceForStep(stepA, randomUUID(), scopeA),
      ).rejects.toMatchObject(notFound)
      await expect(
        ownedProgress.listOwnedEvidenceForStep(stepB, goalB.id as string, scopeA),
      ).rejects.toMatchObject(notFound)
      await expect(
        ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeB),
      ).rejects.toBeInstanceOf(DomainError)

      const [{ evidenceCountAfter }] = await client<[{ evidenceCountAfter: number }]>`
        SELECT count(*)::int AS "evidenceCountAfter" FROM evidence
      `
      expect(evidenceCountAfter).toBe(evidenceCountBefore)

      const listedAAgain = await ownedProgress.listOwnedEvidenceForStep(stepA, goalA.id as string, scopeA)
      expect(listedAAgain).toHaveLength(2)

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
      await expect(
        ownedProgress.listOwnedEvidenceForStep(legacyStep, legacy.id as string, scopeA),
      ).rejects.toMatchObject(notFound)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("scopes Evidence through Step→Path→Goal predicates and does not evaluate I-05 or write", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/infra/db/owned-progress-repository.ts",
      ),
      "utf8",
    )
    expect(source).toMatch(/eq\(learningPathSteps\.id, stepId\)/)
    expect(source).toMatch(/eq\(learningPaths\.goalId, goalId\)/)
    expect(source).toMatch(/eq\(goals\.id, goalId\)/)
    expect(source).toMatch(/eq\(goals\.organizationId, scope\.organizationId\)/)
    expect(source).toMatch(/eq\(goals\.learnerId, scope\.learnerId\)/)
    expect(source).toMatch(/leftJoin\(evidence/)
    expect(source).not.toMatch(/assertEvidenceAllowsCompletion/)
    expect(source).not.toMatch(/evidenceAllowsCompletion/)
    expect(source).not.toMatch(/createDrizzleEvidenceRepository/)
    expect(source).not.toMatch(/getByStepId/)
    expect(source).not.toMatch(/getById\(/)
    expect(source).not.toMatch(/\.insert\(/)
    expect(source).not.toMatch(/\.update\(/)
    expect(source).not.toMatch(/\.delete\(/)
    expect(source).not.toMatch(/COUNT\(/)
    expect(source).not.toMatch(/progressPercent/)
  })
})
