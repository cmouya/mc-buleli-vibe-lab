import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { Evidence, EvidenceAnswer, EvidenceType } from "../../shared/types/domain.types.js"
import type { EvidenceRepository } from "../../modules/evidence/index.js"
import { evidence } from "./schema.js"
import * as schema from "./schema.js"

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
  const mapped: Evidence = {
    id: row.id,
    stepId: row.stepId,
    type: row.type as EvidenceType,
    score: Number(row.score),
    maxScore: Number(row.maxScore),
    passed: row.passed,
    answers: asAnswers(row.answers),
    recordedAt: toIso(row.recordedAt),
  }
  return mapped
}

export function createDrizzleEvidenceRepository(
  db: PostgresJsDatabase<typeof schema>,
): EvidenceRepository {
  return {
    async save(item: Evidence): Promise<Evidence> {
      if (!item.id) {
        throw new Error("Evidence.id is required before save")
      }
      await db.insert(evidence).values({
        id: item.id,
        stepId: item.stepId,
        type: item.type,
        score: String(item.score),
        maxScore: String(item.maxScore),
        passed: item.passed,
        answers: item.answers,
        recordedAt: item.recordedAt,
      })
      const saved = await db.select().from(evidence).where(eq(evidence.id, item.id))
      if (!saved[0]) {
        throw new Error("Evidence save did not persist")
      }
      return toEvidence(saved[0])
    },

    async getById(id: string): Promise<Evidence | null> {
      const rows = await db.select().from(evidence).where(eq(evidence.id, id))
      return rows[0] ? toEvidence(rows[0]) : null
    },

    async getByStepId(stepId: string): Promise<Evidence[]> {
      const rows = await db.select().from(evidence).where(eq(evidence.stepId, stepId))
      return rows.map(toEvidence)
    },
  }
}
