import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"

export const SCHEMA_SLICE = "c2.1-skill-identity-schema" as const

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
})

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
})

export const learners = pgTable(
  "learners",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("learners_org_user").on(table.organizationId, table.userId),
    unique("learners_org_id").on(table.organizationId, table.id),
  ],
)

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
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    learnerId: uuid("learner_id").references(() => learners.id, { onDelete: "restrict" }),
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
    check(
      "goals_ownership_pair_check",
      sql`(${table.organizationId} IS NULL AND ${table.learnerId} IS NULL) OR (${table.organizationId} IS NOT NULL AND ${table.learnerId} IS NOT NULL)`,
    ),
    foreignKey({
      name: "goals_org_learner_fk",
      columns: [table.organizationId, table.learnerId],
      foreignColumns: [learners.organizationId, learners.id],
    }).onDelete("restrict"),
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

export const evidence = pgTable(
  "evidence",
  {
    id: uuid("id").primaryKey(),
    stepId: uuid("step_id")
      .notNull()
      .references(() => learningPathSteps.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    score: numeric("score").notNull(),
    maxScore: numeric("max_score").notNull(),
    passed: boolean("passed").notNull(),
    answers: jsonb("answers").notNull().default([]),
    recordedAt: timestamp("recorded_at", { withTimezone: true, mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("evidence_type_check", sql`${table.type} IN ('quiz_attempt')`),
    check("evidence_score_check", sql`${table.score} >= 0`),
    check("evidence_max_score_check", sql`${table.maxScore} > 0`),
    check("evidence_score_lte_max_check", sql`${table.score} <= ${table.maxScore}`),
    index("evidence_step_id_idx").on(table.stepId),
  ],
)

export const userCredentials = pgTable(
  "user_credentials",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    identifier: text("identifier").notNull(),
    secretHash: text("secret_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("user_credentials_type_check", sql`${table.type} IN ('password')`),
    unique("user_credentials_type_identifier").on(table.type, table.identifier),
    index("user_credentials_user_id_idx").on(table.userId),
  ],
)

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "organization_memberships_role_check",
      sql`${table.role} IN ('org_admin', 'member')`,
    ),
    unique("organization_memberships_org_user").on(table.organizationId, table.userId),
  ],
)

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("sessions_token_hash").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
  ],
)

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("skills_organization_id_idx").on(table.organizationId)],
)

export const goalSkills = pgTable(
  "goal_skills",
  {
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.goalId, table.skillId] }),
    index("goal_skills_skill_id_idx").on(table.skillId),
  ],
)

export const stepSkills = pgTable(
  "step_skills",
  {
    stepId: uuid("step_id")
      .notNull()
      .references(() => learningPathSteps.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.stepId, table.skillId] }),
    index("step_skills_skill_id_idx").on(table.skillId),
  ],
)
