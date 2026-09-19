import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  OwnedLearningPathRepository,
} from "../../modules/learning-path/index.js"
import { goals, learningPaths, learningPathSteps } from "./schema.js"
import * as schema from "./schema.js"

const NOT_FOUND = new DomainError("GOAL_NOT_FOUND", "Goal not found")

function toPath(
  row: typeof learningPaths.$inferSelect,
  stepRows: Array<typeof learningPathSteps.$inferSelect>,
): AcceptedLearningPath {
  const steps: AcceptedPathStep[] = [...stepRows]
    .sort((a, b) => a.position - b.position)
    .map((step) => {
      const mapped: AcceptedPathStep = {
        id: step.id,
        position: step.position,
        title: step.title,
        description: step.description,
      }
      if (step.sourceStepId) {
        mapped.sourceStepId = step.sourceStepId
      }
      return mapped
    })

  const path: AcceptedLearningPath = {
    id: row.id,
    goalId: row.goalId,
    title: row.title,
    steps,
  }
  if (row.summary) {
    path.summary = row.summary
  }
  if (row.sourcePathId) {
    path.sourcePathId = row.sourcePathId
  }
  return path
}

export function createDrizzleOwnedLearningPathRepository(
  db: PostgresJsDatabase<typeof schema>,
): OwnedLearningPathRepository {
  return {
    async saveOwned(path, scope) {
      return db.transaction(async (tx) => {
        const owned = await tx
          .select({ id: goals.id })
          .from(goals)
          .where(
            and(
              eq(goals.id, path.goalId),
              eq(goals.organizationId, scope.organizationId),
              eq(goals.learnerId, scope.learnerId),
            ),
          )
        const authorizedGoalId = owned[0]?.id
        if (!authorizedGoalId) {
          throw NOT_FOUND
        }

        await tx.insert(learningPaths).values({
          id: path.id,
          goalId: authorizedGoalId,
          title: path.title,
          summary: path.summary ?? null,
          sourcePathId: path.sourcePathId ?? null,
          updatedAt: new Date().toISOString(),
        })
        if (path.steps.length > 0) {
          await tx.insert(learningPathSteps).values(
            path.steps.map((step) => ({
              id: step.id,
              pathId: path.id,
              position: step.position,
              title: step.title,
              description: step.description,
              sourceStepId: step.sourceStepId ?? null,
            })),
          )
        }

        const savedPath = await tx.select().from(learningPaths).where(eq(learningPaths.id, path.id))
        if (!savedPath[0]) {
          throw new Error("Owned learning path save did not persist")
        }
        const steps = await tx.select().from(learningPathSteps).where(eq(learningPathSteps.pathId, path.id))
        return toPath(savedPath[0], steps)
      })
    },
  }
}
