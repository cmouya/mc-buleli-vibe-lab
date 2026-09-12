import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { Goal, GoalStatus } from "../../shared/types/domain.types.js"
import type { GoalIntent, LearnerLevel } from "../../shared/types/learner.types.js"
import type { GoalRepository } from "../../modules/goals/index.js"
import { goals } from "./schema.js"
import * as schema from "./schema.js"

const LEVELS: readonly LearnerLevel[] = ["debutant", "intermediaire", "avance"]
const INTENTS: readonly GoalIntent[] = ["professionnel", "personnel", "academique"]
const STATUSES: readonly GoalStatus[] = ["draft", "analyzed", "confirmed", "achieved"]

function asLevel(value: string): LearnerLevel {
  if ((LEVELS as readonly string[]).includes(value)) {
    return value as LearnerLevel
  }
  throw new Error(`invalid persisted goal level: ${value}`)
}

function asIntent(value: string): GoalIntent {
  if ((INTENTS as readonly string[]).includes(value)) {
    return value as GoalIntent
  }
  throw new Error(`invalid persisted goal intent: ${value}`)
}

function asStatus(value: string): GoalStatus {
  if ((STATUSES as readonly string[]).includes(value)) {
    return value as GoalStatus
  }
  throw new Error(`invalid persisted goal status: ${value}`)
}

function toRow(goal: Goal) {
  if (!goal.id) {
    throw new Error("Goal.id is required before save")
  }
  return {
    id: goal.id,
    statement: goal.statement,
    level: goal.level,
    hoursPerWeek: String(goal.hoursPerWeek),
    intent: goal.intent,
    status: goal.status,
    analyzedAt: goal.analyzedAt ?? null,
    confirmedAt: goal.confirmedAt ?? null,
    updatedAt: new Date().toISOString(),
  }
}

function toIso(value: string | null): string | undefined {
  if (!value) {
    return undefined
  }
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) {
    return value
  }
  return new Date(ms).toISOString()
}

function toGoal(row: typeof goals.$inferSelect): Goal {
  const goal: Goal = {
    id: row.id,
    statement: row.statement,
    level: asLevel(row.level),
    hoursPerWeek: Number(row.hoursPerWeek),
    intent: asIntent(row.intent),
    status: asStatus(row.status),
  }
  const analyzedAt = toIso(row.analyzedAt)
  if (analyzedAt) {
    goal.analyzedAt = analyzedAt
  }
  const confirmedAt = toIso(row.confirmedAt)
  if (confirmedAt) {
    goal.confirmedAt = confirmedAt
  }
  return goal
}

export function createDrizzleGoalRepository(
  db: PostgresJsDatabase<typeof schema>,
): GoalRepository {
  return {
    async save(goal: Goal): Promise<Goal> {
      const row = toRow(goal)
      await db
        .insert(goals)
        .values(row)
        .onConflictDoUpdate({
          target: goals.id,
          set: {
            statement: row.statement,
            level: row.level,
            hoursPerWeek: row.hoursPerWeek,
            intent: row.intent,
            status: row.status,
            analyzedAt: row.analyzedAt,
            confirmedAt: row.confirmedAt,
            updatedAt: row.updatedAt,
          },
        })
      const saved = await db.select().from(goals).where(eq(goals.id, row.id))
      if (!saved[0]) {
        throw new Error("Goal save did not persist")
      }
      return toGoal(saved[0])
    },

    async getById(id: string): Promise<Goal | null> {
      const rows = await db.select().from(goals).where(eq(goals.id, id))
      return rows[0] ? toGoal(rows[0]) : null
    },
  }
}
