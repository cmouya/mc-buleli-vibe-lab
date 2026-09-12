import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

export const SCHEMA_SLICE = "m4.3-accepted-path" as const

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

export const learningPaths = pgTable(
  "learning_paths",
  {
    id: uuid("id").primaryKey(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    summary: text("summary"),
    sourcePathId: text("source_path_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("learning_paths_goal_id_idx").on(table.goalId)],
)

export const learningPathSteps = pgTable(
  "learning_path_steps",
  {
    id: uuid("id").primaryKey(),
    pathId: uuid("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sourceStepId: text("source_step_id"),
  },
  (table) => [
    check("learning_path_steps_position_check", sql`${table.position} >= 0`),
    unique("learning_path_steps_path_position").on(table.pathId, table.position),
  ],
)
