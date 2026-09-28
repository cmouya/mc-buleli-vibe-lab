import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import { assertOwnedQuizDefinition } from "../../modules/evidence/assert-owned-quiz-definition.js"
import type { GoalOwnerScope, OwnedStepQuizRepository } from "../../modules/evidence/owned-step-quiz-repository.js"
import { goals, learningPaths, learningPathSteps, stepQuizDefinitions } from "./schema.js"
import * as schema from "./schema.js"

const NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

type Executor = Pick<PostgresJsDatabase<typeof schema>, "select">

async function authorizedStepId(
  db: Executor,
  stepId: string,
  goalId: string,
  scope: GoalOwnerScope,
): Promise<string> {
  const owned = await db
    .select({ stepId: learningPathSteps.id })
    .from(learningPathSteps)
    .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
    .innerJoin(goals, eq(learningPaths.goalId, goals.id))
    .where(
      and(
        eq(learningPathSteps.id, stepId),
        eq(learningPaths.goalId, goalId),
        eq(goals.id, goalId),
        eq(goals.organizationId, scope.organizationId),
        eq(goals.learnerId, scope.learnerId),
      ),
    )
  const id = owned[0]?.stepId
  if (!id) {
    throw NOT_FOUND
  }
  return id
}

export function createDrizzleOwnedStepQuizRepository(
  db: PostgresJsDatabase<typeof schema>,
): OwnedStepQuizRepository {
  return {
    async saveOwned(stepId, goalId, scope, quiz) {
      const validated = assertOwnedQuizDefinition(quiz)
      return db.transaction(async (tx) => {
        const authorized = await authorizedStepId(tx, stepId, goalId, scope)
        const items = validated.items.map((item) => ({
          options: [...item.options],
          correctIndex: item.correctIndex,
        }))
        await tx
          .insert(stepQuizDefinitions)
          .values({
            stepId: authorized,
            minimumCorrectCount: validated.minimumCorrectCount,
            items,
          })
          .onConflictDoUpdate({
            target: stepQuizDefinitions.stepId,
            set: {
              minimumCorrectCount: validated.minimumCorrectCount,
              items,
            },
          })
        const saved = await tx
          .select()
          .from(stepQuizDefinitions)
          .where(eq(stepQuizDefinitions.stepId, authorized))
        const row = saved[0]
        if (!row) {
          throw new Error("Owned quiz save did not persist")
        }
        return assertOwnedQuizDefinition({
          minimumCorrectCount: row.minimumCorrectCount,
          items: row.items,
        })
      })
    },

    async getOwned(stepId, goalId, scope) {
      const authorized = await authorizedStepId(db, stepId, goalId, scope)
      const rows = await db
        .select()
        .from(stepQuizDefinitions)
        .where(eq(stepQuizDefinitions.stepId, authorized))
      const row = rows[0]
      if (!row) {
        return null
      }
      return assertOwnedQuizDefinition({
        minimumCorrectCount: row.minimumCorrectCount,
        items: row.items,
      })
    },
  }
}
