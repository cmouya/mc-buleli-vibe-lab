import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import { evidenceAllowsCompletion, recordQuizEvidence } from "../../src/modules/evidence/index.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import { getOwnedStepCompletion } from "../../src/application/get-owned-progress.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import {
  createDb,
  createDrizzleEvidenceRepository,
  createDrizzleLearnerRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedDerivedContentRepository,
  createDrizzleOwnedEvidenceRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleOwnedProgressRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-28T13:00:00.000Z"
const fields = {
  statement: "Provenance goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function pathFor(goalId: string): AcceptedLearningPath {
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

function attempt(
  stepId: string,
  extra?: { score?: number; passed?: boolean; provenance?: "client_declared" | "server_recalculated" },
) {
  const evidence = recordQuizEvidence(
    {
      id: randomUUID(),
      stepId,
      score: extra?.score ?? 1,
      maxScore: 2,
      passed: extra?.passed ?? false,
      answers: [{ questionIndex: 0, selectedIndex: 1, correct: true }],
    },
    { now: NOW },
  )
  if (extra?.provenance) {
    evidence.scoringProvenance = extra.provenance
  }
  return evidence
}

describe("Slice 2 — Evidence scoring provenance (PostgreSQL)", () => {
  it("defaults omitted provenance to client_declared and rejects null or unknown values", async () => {
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
      const evidenceRepo = createDrizzleEvidenceRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }))
      const userU = await users.save(createUser({ id: randomUUID() }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userU.id as string,
        }),
      )
      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: userU.id as string,
        organizationId: orgA.id as string,
      }
      const goalA = await persistOwnedGoal({ ...fields, statement: "Default" }, contextA, ownedGoals)
      const pathA = await ownedPaths.saveOwned(pathFor(goalA.id as string), {
        organizationId: contextA.organizationId,
        learnerId: contextA.learnerId,
      })
      const stepId = pathA.steps[0]!.id
      const id = randomUUID()

      await client`
        INSERT INTO evidence (id, step_id, type, score, max_score, passed, answers, recorded_at)
        VALUES (
          ${id}::uuid,
          ${stepId}::uuid,
          'quiz_attempt',
          1,
          2,
          false,
          ${JSON.stringify([{ questionIndex: 0, selectedIndex: 1, correct: true }])}::jsonb,
          ${NOW}::timestamptz
        )
      `
      const [{ provenance, nullable }] = await client<[{ provenance: string; nullable: string }]>`
        SELECT scoring_provenance AS "provenance", is_nullable AS "nullable"
        FROM evidence
        JOIN information_schema.columns
          ON table_name = 'evidence' AND column_name = 'scoring_provenance'
        WHERE evidence.id = ${id}::uuid
      `
      expect(provenance).toBe("client_declared")
      expect(nullable).toBe("NO")
      const read = await evidenceRepo.getById(id)
      expect(read?.scoringProvenance).toBe("client_declared")
      expect(read?.score).toBe(1)
      expect(read?.maxScore).toBe(2)
      expect(read?.passed).toBe(false)
      expect(read?.answers).toEqual([{ questionIndex: 0, selectedIndex: 1, correct: true }])

      await expect(
        client`
          INSERT INTO evidence (id, step_id, type, score, max_score, passed, scoring_provenance, recorded_at)
          VALUES (
            ${randomUUID()}::uuid,
            ${stepId}::uuid,
            'quiz_attempt',
            1,
            2,
            false,
            NULL,
            ${NOW}::timestamptz
          )
        `,
      ).rejects.toThrow()
      await expect(
        client`
          INSERT INTO evidence (id, step_id, type, score, max_score, passed, scoring_provenance, recorded_at)
          VALUES (
            ${randomUUID()}::uuid,
            ${stepId}::uuid,
            'quiz_attempt',
            1,
            2,
            false,
            'trusted',
            ${NOW}::timestamptz
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("refuses ordinary self-elevation and writes server_recalculated only from the trusted method", async () => {
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
      const unscoped = createDrizzleEvidenceRepository(db)
      const progress = createDrizzleOwnedProgressRepository(db)
      const derived = createDrizzleOwnedDerivedContentRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }))
      const userU = await users.save(createUser({ id: randomUUID() }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userU.id as string,
        }),
      )
      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: userU.id as string,
        organizationId: orgA.id as string,
      }
      const scopeA = { organizationId: contextA.organizationId, learnerId: contextA.learnerId }
      const goalA = await persistOwnedGoal({ ...fields, statement: "Trust" }, contextA, ownedGoals)
      const pathA = await ownedPaths.saveOwned(pathFor(goalA.id as string), scopeA)
      const stepId = pathA.steps[0]!.id
      const goalId = goalA.id as string

      const elevated = attempt(stepId, { provenance: "server_recalculated", score: 2, passed: true })
      const fromUnscoped = await unscoped.save(elevated)
      expect(fromUnscoped.scoringProvenance).toBe("client_declared")
      expect(fromUnscoped.score).toBe(2)
      expect(fromUnscoped.maxScore).toBe(2)
      expect(fromUnscoped.passed).toBe(true)
      expect(fromUnscoped.answers).toEqual(elevated.answers)
      const [{ unscopedProvenance }] = await client<[{ unscopedProvenance: string }]>`
        SELECT scoring_provenance AS "unscopedProvenance" FROM evidence WHERE id = ${fromUnscoped.id as string}::uuid
      `
      expect(unscopedProvenance).toBe("client_declared")

      const elevatedOwned = attempt(stepId, { provenance: "server_recalculated", passed: false, score: 0 })
      const fromOwned = await ownedEvidence.saveOwned(elevatedOwned, scopeA, goalId)
      expect(fromOwned.scoringProvenance).toBe("client_declared")
      expect(fromOwned.score).toBe(0)
      expect(fromOwned.passed).toBe(false)
      expect(fromOwned.answers).toEqual(elevatedOwned.answers)

      const declared = attempt(stepId, { provenance: "client_declared", passed: true, score: 2 })
      const trusted = await ownedEvidence.saveOwnedServerRecalculated(declared, scopeA, goalId)
      expect(trusted.scoringProvenance).toBe("server_recalculated")
      expect(trusted.score).toBe(2)
      expect(trusted.maxScore).toBe(2)
      expect(trusted.passed).toBe(true)
      expect(trusted.answers).toEqual(declared.answers)
      const [{ trustedProvenance }] = await client<[{ trustedProvenance: string }]>`
        SELECT scoring_provenance AS "trustedProvenance" FROM evidence WHERE id = ${trusted.id as string}::uuid
      `
      expect(trustedProvenance).toBe("server_recalculated")
      expect(await unscoped.getById(trusted.id as string)).toMatchObject({
        scoringProvenance: "server_recalculated",
        score: 2,
        passed: true,
      })

      const omitted = attempt(stepId, { passed: false, score: 0 })
      const trustedDespiteOmission = await ownedEvidence.saveOwnedServerRecalculated(omitted, scopeA, goalId)
      expect(omitted.scoringProvenance).toBeUndefined()
      expect(trustedDespiteOmission.scoringProvenance).toBe("server_recalculated")

      const listed = await progress.listOwnedEvidenceForStep(stepId, goalId, scopeA)
      const trustedRow = listed.find((item) => item.id === trusted.id)
      const declaredRow = listed.find((item) => item.id === fromOwned.id)
      expect(trustedRow?.scoringProvenance).toBe("server_recalculated")
      expect(declaredRow?.scoringProvenance).toBe("client_declared")
      expect(evidenceAllowsCompletion(trustedRow!, stepId)).toBe(true)
      expect(evidenceAllowsCompletion(declaredRow!, stepId)).toBe(false)

      const completion = await getOwnedStepCompletion(stepId, goalId, contextA, derived, progress)
      expect(completion).toEqual({ stepId, complete: true })
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
