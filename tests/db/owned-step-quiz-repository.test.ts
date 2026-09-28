import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { DomainError } from "../../src/modules/shared/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import type { OwnedQuizDefinition } from "../../src/modules/evidence/index.js"
import { recordQuizEvidence } from "../../src/modules/evidence/index.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import {
  createDb,
  createDrizzleEvidenceRepository,
  createDrizzleLearnerRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedDerivedContentRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleOwnedStepQuizRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-28T12:00:00.000Z"
const NOT_FOUND = { code: "RESOURCE_NOT_FOUND", message: "Not found" }
const SECRET = "secret-key-option"

const fields = {
  statement: "Owned quiz goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function pathFor(goalId: string, titles = ["Quiz"]): AcceptedLearningPath {
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

const firstQuiz: OwnedQuizDefinition = {
  minimumCorrectCount: 1,
  items: [{ options: [SECRET, "other"], correctIndex: 0 }],
}

const replacementQuiz: OwnedQuizDefinition = {
  minimumCorrectCount: 2,
  items: [
    { options: ["a", "b"], correctIndex: 1 },
    { options: ["c", "d"], correctIndex: 0 },
  ],
}

describe("Slice 2 — owned step quiz repository (PostgreSQL)", () => {
  it("saves and reads a quiz only through Step→Path→Goal ownership and fails closed otherwise", async () => {
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
      const quizzes = createDrizzleOwnedStepQuizRepository(db)
      const derived = createDrizzleOwnedDerivedContentRepository(db)

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
      const scopeA2 = { organizationId: orgA.id as string, learnerId: learnerA2.id as string }

      const goalA = await persistOwnedGoal({ ...fields, statement: "GA" }, contextA, ownedGoals)
      const goalB = await persistOwnedGoal({ ...fields, statement: "GB" }, contextB, ownedGoals)
      const pathA = await ownedPaths.saveOwned(pathFor(goalA.id as string, ["Quiz", "Extra"]), scopeA)
      const pathB = await ownedPaths.saveOwned(pathFor(goalB.id as string), scopeB)
      const stepA = pathA.steps[0]!.id
      const stepExtra = pathA.steps[1]!.id
      const stepB = pathB.steps[0]!.id
      const goalAId = goalA.id as string
      const goalBId = goalB.id as string

      expect(await quizzes.getOwned(stepA, goalAId, scopeA)).toBeNull()

      const saved = await quizzes.saveOwned(stepA, goalAId, scopeA, firstQuiz)
      expect(saved).toEqual(firstQuiz)
      expect(await quizzes.getOwned(stepA, goalAId, scopeA)).toEqual(firstQuiz)

      const ownedStep = await derived.getOwnedStepById(stepA, goalAId, scopeA)
      const ownedPath = await derived.getOwnedPathByGoalId(goalAId, scopeA)
      const stepJson = JSON.stringify(ownedStep)
      const pathJson = JSON.stringify(ownedPath)
      expect(stepJson).not.toMatch(/correctIndex/)
      expect(stepJson).not.toMatch(/secret-key-option/)
      expect(pathJson).not.toMatch(/correctIndex/)
      expect(pathJson).not.toMatch(/secret-key-option/)
      expect(ownedStep).toEqual({
        id: stepA,
        position: 0,
        title: "Quiz",
        description: "",
      })

      const replaced = await quizzes.saveOwned(stepA, goalAId, scopeA, replacementQuiz)
      expect(replaced).toEqual(replacementQuiz)
      expect(await quizzes.getOwned(stepA, goalAId, scopeA)).toEqual(replacementQuiz)
      const [{ quizCount }] = await client<[{ quizCount: number }]>`
        SELECT count(*)::int AS "quizCount" FROM step_quiz_definitions WHERE step_id = ${stepA}::uuid
      `
      expect(quizCount).toBe(1)

      const denied = [
        () => quizzes.getOwned(stepA, goalAId, scopeB),
        () => quizzes.getOwned(stepA, goalAId, scopeA2),
        () => quizzes.getOwned(stepA, goalBId, scopeA),
        () => quizzes.getOwned(stepB, goalAId, scopeA),
        () => quizzes.getOwned(randomUUID(), goalAId, scopeA),
        () => quizzes.saveOwned(stepA, goalAId, scopeB, firstQuiz),
        () => quizzes.saveOwned(stepB, goalAId, scopeA, firstQuiz),
      ]
      for (const run of denied) {
        await expect(run()).rejects.toMatchObject(NOT_FOUND)
        await expect(run()).rejects.toBeInstanceOf(DomainError)
      }

      expect(await quizzes.getOwned(stepA, goalAId, scopeA)).toEqual(replacementQuiz)
      const [{ stillOne }] = await client<[{ stillOne: number }]>`
        SELECT count(*)::int AS "stillOne" FROM step_quiz_definitions WHERE step_id = ${stepA}::uuid
      `
      expect(stillOne).toBe(1)

      await expect(
        quizzes.saveOwned(stepExtra, goalAId, scopeA, { minimumCorrectCount: 1, items: [] }),
      ).rejects.toMatchObject({ code: "QUIZ_DEFINITION_INVALID" })
      await expect(
        quizzes.saveOwned(stepExtra, goalAId, scopeA, {
          minimumCorrectCount: 1,
          items: [{ options: [], correctIndex: 0 }],
        }),
      ).rejects.toMatchObject({ code: "QUIZ_DEFINITION_INVALID" })
      await expect(
        quizzes.saveOwned(stepExtra, goalAId, scopeA, {
          minimumCorrectCount: 1,
          items: [{ options: ["a", "b"], correctIndex: 2 }],
        }),
      ).rejects.toMatchObject({ code: "QUIZ_DEFINITION_INVALID" })
      const [{ extraCount }] = await client<[{ extraCount: number }]>`
        SELECT count(*)::int AS "extraCount" FROM step_quiz_definitions WHERE step_id = ${stepExtra}::uuid
      `
      expect(extraCount).toBe(0)

      await client`
        INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
        VALUES (
          ${stepExtra}::uuid,
          1,
          ${JSON.stringify([{ options: [], correctIndex: 0 }])}::jsonb
        )
      `
      await expect(quizzes.getOwned(stepExtra, goalAId, scopeA)).rejects.toMatchObject({
        code: "QUIZ_DEFINITION_INVALID",
      })
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("enforces quiz row, foreign-key, check, and cascade constraints", async () => {
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
      const evidence = createDrizzleEvidenceRepository(db)

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
      const goalA = await persistOwnedGoal({ ...fields, statement: "Constraints" }, contextA, ownedGoals)
      const pathA = await ownedPaths.saveOwned(pathFor(goalA.id as string, ["Keyed", "Proven"]), scopeA)
      const keyedStep = pathA.steps[0]!.id
      const evidencedStep = pathA.steps[1]!.id

      await client`
        INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
        VALUES (${keyedStep}::uuid, 1, ${JSON.stringify([{ options: ["a"], correctIndex: 0 }])}::jsonb)
      `
      await expect(
        client`
          INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
          VALUES (${keyedStep}::uuid, 1, ${JSON.stringify([{ options: ["b"], correctIndex: 0 }])}::jsonb)
        `,
      ).rejects.toThrow()
      const [{ quizCount }] = await client<[{ quizCount: number }]>`
        SELECT count(*)::int AS "quizCount" FROM step_quiz_definitions WHERE step_id = ${keyedStep}::uuid
      `
      expect(quizCount).toBe(1)

      await expect(
        client`
          INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
          VALUES (${randomUUID()}::uuid, 1, ${JSON.stringify([{ options: ["a"], correctIndex: 0 }])}::jsonb)
        `,
      ).rejects.toThrow()
      await expect(
        client`
          INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
          VALUES (${keyedStep}::uuid, 0, ${JSON.stringify([{ options: ["a"], correctIndex: 0 }])}::jsonb)
        `,
      ).rejects.toThrow()
      await expect(
        client`
          INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
          VALUES (${evidencedStep}::uuid, 1, '[]'::jsonb)
        `,
      ).rejects.toThrow()
      await expect(
        client`
          INSERT INTO step_quiz_definitions (step_id, minimum_correct_count, items)
          VALUES (${evidencedStep}::uuid, 2, ${JSON.stringify([{ options: ["a"], correctIndex: 0 }])}::jsonb)
        `,
      ).rejects.toThrow()

      const [{ cascadeDelete }] = await client<[{ cascadeDelete: string }]>`
        SELECT confdeltype AS "cascadeDelete"
        FROM pg_constraint
        WHERE conname = 'step_quiz_definitions_step_id_learning_path_steps_id_fk'
      `
      expect(cascadeDelete).toBe("c")
      await client`DELETE FROM learning_path_steps WHERE id = ${keyedStep}::uuid`
      const [{ afterDelete }] = await client<[{ afterDelete: number }]>`
        SELECT count(*)::int AS "afterDelete" FROM step_quiz_definitions WHERE step_id = ${keyedStep}::uuid
      `
      expect(afterDelete).toBe(0)

      await evidence.save(
        recordQuizEvidence(
          {
            id: randomUUID(),
            stepId: evidencedStep,
            score: 1,
            maxScore: 2,
            passed: false,
            answers: [{ questionIndex: 0, selectedIndex: 0, correct: false }],
          },
          { now: NOW },
        ),
      )
      const [{ restrictDelete }] = await client<[{ restrictDelete: string }]>`
        SELECT confdeltype AS "restrictDelete"
        FROM pg_constraint
        WHERE conname = 'evidence_step_id_learning_path_steps_id_fk'
      `
      expect(restrictDelete).toBe("r")
      await expect(client`DELETE FROM learning_path_steps WHERE id = ${evidencedStep}::uuid`).rejects.toThrow()
      const [{ evidenceLeft }] = await client<[{ evidenceLeft: number }]>`
        SELECT count(*)::int AS "evidenceLeft" FROM evidence WHERE step_id = ${evidencedStep}::uuid
      `
      expect(evidenceLeft).toBe(1)
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
