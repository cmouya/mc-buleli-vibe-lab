import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bindOwnedGoalSkill } from "../../src/application/bind-owned-goal-skill.js"
import { persistOrganizationSkill } from "../../src/application/persist-organization-skill.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import { createGoal } from "../../src/modules/goals/index.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createDrizzleGoalSkillRepository,
  createDrizzleLearnerRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOrganizationSkillRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleUserRepository,
  createSqlClient,
  goalSkills,
  migrateDatabase,
  requireDatabaseUrl,
  stepSkills,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-26T00:00:00.000Z"
const fields = {
  statement: "C2.3 bind goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

describe("C2.3 — GoalSkill repository (PostgreSQL)", () => {
  it("binds owned Goals to same-org Skills idempotently and fails closed without leaking", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const ownedGoals = createDrizzleOwnedGoalRepository(db)
      const unscopedGoals = createDrizzleGoalRepository(db)
      const catalog = createDrizzleOrganizationSkillRepository(db)
      const binds = createDrizzleGoalSkillRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }, { now: NOW }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }, { now: NOW }))
      const user = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: user.id as string,
        }),
      )
      const learnerA2 = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: (await users.save(createUser({ id: randomUUID() }, { now: NOW }))).id as string,
        }),
      )
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: user.id as string,
        }),
      )

      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: user.id as string,
        organizationId: orgA.id as string,
      }
      const contextA2: LearnerContext = {
        learnerId: learnerA2.id as string,
        userId: learnerA2.userId,
        organizationId: orgA.id as string,
      }
      const contextB: LearnerContext = {
        learnerId: learnerB.id as string,
        userId: user.id as string,
        organizationId: orgB.id as string,
      }

      const goalA = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextA, ownedGoals)
      const goalA2 = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextA, ownedGoals)
      const skillA1 = await persistOrganizationSkill(
        { id: randomUUID(), name: "Python" },
        orgA.id as string,
        catalog,
      )
      const skillA2 = await persistOrganizationSkill(
        { id: randomUUID(), name: "SQL" },
        orgA.id as string,
        catalog,
      )
      const skillB = await persistOrganizationSkill(
        { id: randomUUID(), name: "Python" },
        orgB.id as string,
        catalog,
      )

      const stepSkillKey = (row: { stepId: string; skillId: string }) => `${row.stepId}:${row.skillId}`
      const stepSkillsBefore = await db.select().from(stepSkills)
      const stepSkillKeysBefore = stepSkillsBefore.map(stepSkillKey).sort()

      const first = await bindOwnedGoalSkill(
        {
          goalId: goalA.id as string,
          skillId: skillA1.id,
          organizationId: "forged-org",
          learnerId: "forged-learner",
        },
        contextA,
        binds,
      )
      expect(first).toEqual({ goalId: goalA.id, skillId: skillA1.id })
      const again = await bindOwnedGoalSkill(
        { goalId: goalA.id as string, skillId: skillA1.id },
        contextA,
        binds,
      )
      expect(again).toEqual(first)
      const goalARows = await db.select().from(goalSkills).where(eq(goalSkills.goalId, goalA.id as string))
      expect(goalARows).toHaveLength(1)

      await bindOwnedGoalSkill(
        { goalId: goalA.id as string, skillId: skillA2.id },
        contextA,
        binds,
      )
      expect(
        (await db.select().from(goalSkills).where(eq(goalSkills.goalId, goalA.id as string))).length,
      ).toBe(2)
      await bindOwnedGoalSkill(
        { goalId: goalA2.id as string, skillId: skillA1.id },
        contextA,
        binds,
      )
      expect(
        (await db.select().from(goalSkills).where(eq(goalSkills.skillId, skillA1.id))).length,
      ).toBe(2)

      const beforeFail = (await db.select().from(goalSkills)).length
      await expect(
        bindOwnedGoalSkill(
          { goalId: goalA.id as string, skillId: skillB.id },
          contextA,
          binds,
        ),
      ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" })
      await expect(
        bindOwnedGoalSkill(
          { goalId: goalA.id as string, skillId: skillA1.id },
          contextB,
          binds,
        ),
      ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" })
      await expect(
        bindOwnedGoalSkill(
          { goalId: goalA.id as string, skillId: skillA1.id },
          contextA2,
          binds,
        ),
      ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" })
      await expect(
        bindOwnedGoalSkill(
          { goalId: goalA.id as string, skillId: randomUUID() },
          contextA,
          binds,
        ),
      ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" })

      const legacy = await unscopedGoals.save(
        createGoal({ ...fields, id: randomUUID() }, { now: NOW }),
      )
      await expect(
        bindOwnedGoalSkill(
          { goalId: legacy.id as string, skillId: skillA1.id },
          contextA,
          binds,
        ),
      ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" })

      expect((await db.select().from(goalSkills)).length).toBe(beforeFail)
      const stepSkillsAfter = await db.select().from(stepSkills)
      expect(stepSkillsAfter).toHaveLength(stepSkillsBefore.length)
      expect(stepSkillsAfter.map(stepSkillKey).sort()).toEqual(stepSkillKeysBefore)
      const fixtureSkillIds = new Set([skillA1.id, skillA2.id, skillB.id])
      expect(stepSkillsAfter.filter((row) => fixtureSkillIds.has(row.skillId))).toEqual([])
      expect(
        (await db.select().from(goalSkills).where(eq(goalSkills.skillId, skillB.id))).length,
      ).toBe(0)

      await expect(
        db.insert(goalSkills).values({
          goalId: goalA.id as string,
          skillId: randomUUID(),
        }),
      ).rejects.toThrow()
      expect((await db.select().from(goalSkills)).length).toBe(beforeFail)
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
