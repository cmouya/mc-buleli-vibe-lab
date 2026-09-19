import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import type { Evidence, EvidenceAnswer, EvidenceType } from "../../shared/types/domain.types.js"
import type { OwnedEvidenceRepository } from "../../modules/evidence/index.js"
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

export function createDrizzleOwnedEvidenceRepository(
  db: PostgresJsDatabase<typeof schema>,
): OwnedEvidenceRepository {
  return {
    async saveOwned(item, scope, goalId) {
      const evidenceId = item.id
      if (!evidenceId) {
        throw new Error("Evidence.id is required before save")
      }
      return db.transaction(async (tx) => {
        const owned = await tx
          .select({ stepId: learningPathSteps.id })
          .from(learningPathSteps)
          .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
          .innerJoin(goals, eq(learningPaths.goalId, goals.id))
          .where(
            and(
              eq(learningPathSteps.id, item.stepId),
              eq(learningPaths.goalId, goalId),
              eq(goals.id, goalId),
              eq(goals.organizationId, scope.organizationId),
              eq(goals.learnerId, scope.learnerId),
            ),
          )
        const authorizedStepId = owned[0]?.stepId
        if (!authorizedStepId) {
          throw NOT_FOUND
        }

        await tx.insert(evidence).values({
          id: evidenceId,
          stepId: authorizedStepId,
          type: item.type,
          score: String(item.score),
          maxScore: String(item.maxScore),
          passed: item.passed,
          answers: item.answers,
          recordedAt: item.recordedAt,
        })
        const saved = await tx.select().from(evidence).where(eq(evidence.id, evidenceId))
        if (!saved[0]) {
          throw new Error("Owned evidence save did not persist")
        }
        return toEvidence(saved[0])
      })
    },
  }
}
