import { sql } from "drizzle-orm"
import {
  check,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const SCHEMA_SLICE = "m4.2-goal" as const

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey(),
    statement: text("statement").notNull(),
    level: text("level").notNull(),
    hoursPerWeek: numeric("hours_per_week").notNull(),
    intent: text("intent").notNull(),
    status: text("status").notNull(),
    analyzedAt: timestamp("analyzed_at", { withTimezone: true, mode: "string" }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("goals_level_check", sql`${table.level} IN ('debutant', 'intermediaire', 'avance')`),
    check(
      "goals_intent_check",
      sql`${table.intent} IN ('professionnel', 'personnel', 'academique')`,
    ),
    check(
      "goals_status_check",
      sql`${table.status} IN ('draft', 'analyzed', 'confirmed', 'achieved')`,
    ),
    check("goals_hours_check", sql`${table.hoursPerWeek} > 0`),
  ],
)
