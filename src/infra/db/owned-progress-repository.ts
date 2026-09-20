import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import type { Evidence, EvidenceAnswer, EvidenceType } from "../../shared/types/domain.types.js"
import type { OwnedProgressRepository } from "../../modules/evidence/index.js"
import { evidence, goals, learningPaths, learningPathSteps } from "./schema.js"
import * as schema from "./schema.js"

const NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

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

export function createDrizzleOwnedProgressRepository(
  db: PostgresJsDatabase<typeof schema>,
): OwnedProgressRepository {
  return {
    async listOwnedEvidenceForStep(stepId, goalId, scope) {
      const rows = await db
        .select({ item: evidence, authorizedStepId: learningPathSteps.id })
        .from(learningPathSteps)
        .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
        .innerJoin(goals, eq(learningPaths.goalId, goals.id))
        .leftJoin(evidence, eq(evidence.stepId, learningPathSteps.id))
        .where(
          and(
            eq(learningPathSteps.id, stepId),
            eq(learningPaths.goalId, goalId),
            eq(goals.id, goalId),
            eq(goals.organizationId, scope.organizationId),
            eq(goals.learnerId, scope.learnerId),
          ),
        )

      const authorizedStepId = rows[0]?.authorizedStepId
      if (!authorizedStepId) {
        throw NOT_FOUND
      }

      return rows.flatMap((row) => (row.item?.id ? [toEvidence(row.item)] : []))
    },
  }
}
