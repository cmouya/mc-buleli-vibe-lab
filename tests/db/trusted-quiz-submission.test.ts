import { randomUUID } from "node:crypto"
import { eq, inArray } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { submitOwnedQuizAttempt } from "../../src/application/submit-owned-quiz-attempt.js"
import { persistOwnedEvidence } from "../../src/application/persist-owned-evidence.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import { getOwnedPathProgress } from "../../src/application/get-owned-progress.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import {
  createDb, createSqlClient, migrateDatabase, requireDatabaseUrl,
  createDrizzleOrganizationRepository, createDrizzleUserRepository, createDrizzleLearnerRepository,
  createDrizzleOwnedGoalRepository, createDrizzleOwnedLearningPathRepository,
  createDrizzleOwnedDerivedContentRepository, createDrizzleOwnedStepQuizRepository,
  createDrizzleOwnedEvidenceRepository, createDrizzleOwnedProgressRepository,
  evidence, evidenceSkills,
} from "../../src/infra/db/index.js"

// The same application boundary exercised by HTTP, backed by real owned adapters.
describe("Slice 3 — trusted submission persistence (PostgreSQL)", () => {
  it("persists recomputed provenance, blocks invalid/legacy writes, keeps history and attribution unchanged", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const org = await createDrizzleOrganizationRepository(db).save(createOrganization({ id: randomUUID(), name: "Slice 3" }))
      const user = await createDrizzleUserRepository(db).save(createUser({ id: randomUUID() }))
      const learner = await createDrizzleLearnerRepository(db).save(createLearner({
        id: randomUUID(), organizationId: org.id!, userId: user.id!,
      }))
      const context = { organizationId: org.id!, userId: user.id!, learnerId: learner.id! }
      const scope = { organizationId: context.organizationId, learnerId: context.learnerId }
      const goal = await persistOwnedGoal({ statement: "Learn", level: "debutant", hoursPerWeek: 2,
        intent: "personnel" }, context, createDrizzleOwnedGoalRepository(db))
      const goalId = goal.id!
      const path = await createDrizzleOwnedLearningPathRepository(db).saveOwned({ id: randomUUID(), goalId,
        title: "Path", steps: [0, 1].map((position) => ({ id: randomUUID(), position, title: "Quiz", description: "" })) }, scope)
      const stepId = path.steps[0]!.id
      const legacyStep = path.steps[1]!.id
      const derived = createDrizzleOwnedDerivedContentRepository(db)
      const quizzes = createDrizzleOwnedStepQuizRepository(db)
      const writes = createDrizzleOwnedEvidenceRepository(db)
      const progressRepo = createDrizzleOwnedProgressRepository(db)
      const key = { minimumCorrectCount: 1, items: [{ options: ["a", "b"], correctIndex: 1 }] }
      const selections = [{ questionIndex: 0, selectedIndex: 1 }]
      const declared = { score: 1, maxScore: 1, passed: true, answers: [{ ...selections[0]!, correct: true }] }
      const history = await persistOwnedEvidence({ goalId, stepId: legacyStep, ...declared }, context, derived, writes, quizzes)
      await quizzes.saveOwned(stepId, goalId, scope, key)
      await quizzes.saveOwned(legacyStep, goalId, scope, key)
      const rows = () => db.select().from(evidence).where(inArray(evidence.stepId, [stepId, legacyStep]))
      const before = await rows()
      await expect(persistOwnedEvidence({ goalId, stepId, ...declared }, context, derived, writes, quizzes))
        .rejects.toMatchObject({ code: "QUIZ_TRUSTED_SUBMISSION_REQUIRED" })
      await expect(submitOwnedQuizAttempt({ goalId, stepId, selections: [] }, context, derived, quizzes, writes))
        .rejects.toMatchObject({ code: "QUIZ_SELECTION_INVALID" })
      for (const foreign of [{ ...context, organizationId: randomUUID() }, { ...context, learnerId: randomUUID() }]) {
        await expect(submitOwnedQuizAttempt({ goalId, stepId, selections }, foreign, derived, quizzes, writes))
          .rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
      }
      expect(await rows()).toEqual(before)
      const failed = await submitOwnedQuizAttempt({ goalId, stepId, selections: [{ questionIndex: 0, selectedIndex: 0 }] },
        context, derived, quizzes, writes)
      expect(failed).toMatchObject({ score: 0, passed: false, scoringProvenance: "server_recalculated" })
      expect((await getOwnedPathProgress(goalId, context, derived, progressRepo)).completedSteps).toBe(1)
      const passed = await submitOwnedQuizAttempt({ goalId, stepId, selections }, context, derived, quizzes, writes)
      expect(passed).toMatchObject({ score: 1, maxScore: 1, passed: true, scoringProvenance: "server_recalculated" })
      const read = await derived.getOwnedEvidenceById(passed.id!, goalId, scope)
      expect(read?.answers).toEqual(declared.answers)
      expect(read?.scoringProvenance).toBe("server_recalculated")
      await submitOwnedQuizAttempt({ goalId, stepId, selections: [{ questionIndex: 0, selectedIndex: 0 }] },
        context, derived, quizzes, writes)
      expect(await getOwnedPathProgress(goalId, context, derived, progressRepo))
        .toEqual({ totalSteps: 2, completedSteps: 2, progressPercent: 100 })
      expect(await derived.getOwnedEvidenceById(history.id!, goalId, scope)).toEqual(history)
      expect(await db.select().from(evidenceSkills).where(eq(evidenceSkills.evidenceId, passed.id!))).toEqual([])
      const persisted = await rows()
      expect(persisted).toHaveLength(4)
      expect(persisted.filter((row) => row.scoringProvenance === "server_recalculated")).toHaveLength(3)
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
