import { asc, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  LearningPathRepository,
} from "../../modules/learning-path/index.js"
import { learningPaths, learningPathSteps } from "./schema.js"
import * as schema from "./schema.js"

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

export function createDrizzleLearningPathRepository(
  db: PostgresJsDatabase<typeof schema>,
): LearningPathRepository {
  async function loadById(id: string): Promise<AcceptedLearningPath | null> {
    const rows = await db.select().from(learningPaths).where(eq(learningPaths.id, id))
    if (!rows[0]) {
      return null
    }
    const steps = await db
      .select()
      .from(learningPathSteps)
      .where(eq(learningPathSteps.pathId, id))
      .orderBy(asc(learningPathSteps.position))
    return toPath(rows[0], steps)
  }

  return {
    async save(path: AcceptedLearningPath): Promise<AcceptedLearningPath> {
      await db.transaction(async (tx) => {
        await tx.insert(learningPaths).values({
          id: path.id,
          goalId: path.goalId,
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
      })
      const saved = await loadById(path.id)
      if (!saved) {
        throw new Error("Learning path save did not persist")
      }
      return saved
    },

    getById: loadById,

    async getByGoalId(goalId: string): Promise<AcceptedLearningPath[]> {
      const rows = await db.select().from(learningPaths).where(eq(learningPaths.goalId, goalId))
      const result: AcceptedLearningPath[] = []
      for (const row of rows) {
        const loaded = await loadById(row.id)
        if (loaded) {
          result.push(loaded)
        }
      }
      return result
    },
  }
}
