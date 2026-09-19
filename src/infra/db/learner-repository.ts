import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { Learner, LearnerRepository } from "../../modules/learner/index.js"
import { learners } from "./schema.js"
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

function requireId(id: string | undefined, label: string): string {
  if (!id) {
    throw new Error(`${label}.id is required before save`)
  }
  return id
}

function toLearner(row: typeof learners.$inferSelect): Learner {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    createdAt: toIso(row.createdAt),
  }
}

export function createDrizzleLearnerRepository(
  db: PostgresJsDatabase<typeof schema>,
): LearnerRepository {
  return {
    async save(item: Learner): Promise<Learner> {
      const id = requireId(item.id, "Learner")
      await db.insert(learners).values({
        id,
        organizationId: item.organizationId,
        userId: item.userId,
        createdAt: item.createdAt,
      })
      const saved = await db.select().from(learners).where(eq(learners.id, id))
      if (!saved[0]) {
        throw new Error("Learner save did not persist")
      }
      return toLearner(saved[0])
    },
    async getByOrganizationAndUserId(
      organizationId: string,
      userId: string,
    ): Promise<Learner | null> {
      const rows = await db
        .select()
        .from(learners)
        .where(and(eq(learners.organizationId, organizationId), eq(learners.userId, userId)))
      return rows[0] ? toLearner(rows[0]) : null
    },
  }
}
