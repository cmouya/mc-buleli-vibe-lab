import { and, asc, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { Evidence, EvidenceAnswer, EvidenceType } from "../../shared/types/domain.types.js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  OwnedDerivedContentRepository,
} from "../../modules/learning-path/index.js"
import { evidence, goals, learningPaths, learningPathSteps } from "./schema.js"
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

function toStep(step: typeof learningPathSteps.$inferSelect): AcceptedPathStep {
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
}

function toIso(value: string | null): string {
  if (!value) {
    return new Date().toISOString()
  }
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) {
    return value
  }
  return new Date(ms).toISOString()
}

function asAnswers(value: unknown): EvidenceAnswer[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((item) => {
    const record = item as Record<string, unknown>
    return {
      questionIndex: Number(record.questionIndex),
      selectedIndex: Number(record.selectedIndex),
      correct: Boolean(record.correct),
    }
  })
}

function toEvidence(row: typeof evidence.$inferSelect): Evidence {
  return {
    id: row.id,
    stepId: row.stepId,
    type: row.type as EvidenceType,
    score: Number(row.score),
    maxScore: Number(row.maxScore),
    passed: row.passed,
    answers: asAnswers(row.answers),
    recordedAt: toIso(row.recordedAt),
  }
}

export function createDrizzleOwnedDerivedContentRepository(
  db: PostgresJsDatabase<typeof schema>,
): OwnedDerivedContentRepository {
  return {
    async getOwnedPathByGoalId(goalId, scope) {
      const rows = await db
        .select({ path: learningPaths })
        .from(learningPaths)
        .innerJoin(goals, eq(learningPaths.goalId, goals.id))
        .where(
          and(
            eq(learningPaths.goalId, goalId),
            eq(goals.organizationId, scope.organizationId),
            eq(goals.learnerId, scope.learnerId),
          ),
        )
      const pathRow = rows[0]?.path
      if (!pathRow) {
        return null
      }
      const steps = await db
        .select()
        .from(learningPathSteps)
        .where(eq(learningPathSteps.pathId, pathRow.id))
        .orderBy(asc(learningPathSteps.position))
      return toPath(pathRow, steps)
    },

    async getOwnedStepById(stepId, goalId, scope) {
      const rows = await db
        .select({ step: learningPathSteps })
        .from(learningPathSteps)
        .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
        .innerJoin(goals, eq(learningPaths.goalId, goals.id))
        .where(
          and(
            eq(learningPathSteps.id, stepId),
            eq(learningPaths.goalId, goalId),
            eq(goals.organizationId, scope.organizationId),
            eq(goals.learnerId, scope.learnerId),
          ),
        )
      return rows[0] ? toStep(rows[0].step) : null
    },

    async getOwnedEvidenceById(evidenceId, goalId, scope) {
      const rows = await db
        .select({ item: evidence })
        .from(evidence)
        .innerJoin(learningPathSteps, eq(evidence.stepId, learningPathSteps.id))
        .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
        .innerJoin(goals, eq(learningPaths.goalId, goals.id))
        .where(
          and(
            eq(evidence.id, evidenceId),
            eq(learningPaths.goalId, goalId),
            eq(goals.organizationId, scope.organizationId),
            eq(goals.learnerId, scope.learnerId),
          ),
        )
      return rows[0] ? toEvidence(rows[0].item) : null
    },
  }
}
