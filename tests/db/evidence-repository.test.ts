import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { confirmGoal, createGoal, markGoalAnalyzed } from "../../src/modules/goals/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import { recordQuizEvidence } from "../../src/modules/evidence/index.js"
import {
  createDb,
  createDrizzleEvidenceRepository,
  createDrizzleGoalRepository,
  createDrizzleLearningPathRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-12T18:00:00.000Z"

async function seedStep() {
  const url = requireDatabaseUrl()
  await migrateDatabase(url)
  const client = createSqlClient(url)
  const db = createDb(client)
  const goals = createDrizzleGoalRepository(db)
  const paths = createDrizzleLearningPathRepository(db)
  const evidenceRepo = createDrizzleEvidenceRepository(db)
  const goal = await goals.save(
    confirmGoal(
      markGoalAnalyzed(
        createGoal({
          statement: "Evidence persist goal",
          level: "debutant",
          hoursPerWeek: 5,
          intent: "professionnel",
          id: randomUUID(),
        }),
        { now: NOW },
      ),
      { now: NOW },
    ),
  )
  const path: AcceptedLearningPath = {
    id: randomUUID(),
    goalId: goal.id as string,
    title: "Path",
    steps: [
      {
        id: randomUUID(),
        position: 0,
        title: "Step",
        description: "",
      },
    ],
  }
  const savedPath = await paths.save(path)
  return { client, evidenceRepo, stepId: savedPath.steps[0]!.id }
}

describe("M4.4 — Evidence repository (PostgreSQL)", () => {
  it("saves failed and passed attempts for the same durable step", async () => {
    const { client, evidenceRepo, stepId } = await seedStep()
    try {
      const failed = await evidenceRepo.save(
        recordQuizEvidence(
          {
            id: randomUUID(),
            stepId,
            score: 0,
            maxScore: 3,
            passed: false,
            answers: [{ questionIndex: 0, selectedIndex: 0, correct: false }],
          },
          { now: NOW },
        ),
      )
      const passed = await evidenceRepo.save(
        recordQuizEvidence(
          {
            id: randomUUID(),
            stepId,
            score: 3,
            maxScore: 3,
            passed: true,
            answers: [{ questionIndex: 0, selectedIndex: 1, correct: true }],
          },
          { now: NOW },
        ),
      )
      expect(failed.passed).toBe(false)
      expect(passed.passed).toBe(true)
      expect(passed.recordedAt).toBe(NOW)
      expect(passed.answers).toEqual([{ questionIndex: 0, selectedIndex: 1, correct: true }])
      const byStep = await evidenceRepo.getByStepId(stepId)
      expect(byStep).toHaveLength(2)
      expect(await evidenceRepo.getById(failed.id as string)).toEqual(failed)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects evidence whose step_id does not exist", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const evidenceRepo = createDrizzleEvidenceRepository(db)
      await expect(
        evidenceRepo.save(
          recordQuizEvidence({
            id: randomUUID(),
            stepId: randomUUID(),
            score: 1,
            maxScore: 3,
            passed: false,
            answers: [],
          }),
        ),
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects score greater than max_score via CHECK", async () => {
    const { client, stepId } = await seedStep()
    try {
      await expect(
        client`
          INSERT INTO evidence (id, step_id, type, score, max_score, passed, recorded_at)
          VALUES (
            ${randomUUID()}::uuid,
            ${stepId}::uuid,
            'quiz_attempt',
            5,
            3,
            false,
            ${NOW}::timestamptz
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
