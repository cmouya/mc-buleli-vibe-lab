import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bindOwnedStepSkill } from "../../src/application/bind-owned-step-skill.js"
import { persistOrganizationSkill } from "../../src/application/persist-organization-skill.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import { createGoal } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleLearningPathRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOrganizationSkillRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleStepSkillRepository,
  createDrizzleUserRepository,
  createSqlClient,
  evidence,
  goalSkills,
  goals,
  learningPaths,
  learningPathSteps,
  migrateDatabase,
  requireDatabaseUrl,
  stepSkills,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-26T00:00:00.000Z"
const fields = {
  statement: "C2.4 bind step",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function pairKey(left: string, right: string): string {
  return `${left}:${right}`
}

function stepSkillKeys(rows: Array<{ stepId: string; skillId: string }>): string[] {
  return rows.map((row) => pairKey(row.stepId, row.skillId)).sort()
}

function goalSkillKeys(rows: Array<{ goalId: string; skillId: string }>): string[] {
  return rows.map((row) => pairKey(row.goalId, row.skillId)).sort()
}

function acceptedPath(goalId: string, stepCount = 1): AcceptedLearningPath {
  const steps = Array.from({ length: stepCount }, (_, position) => ({
    id: randomUUID(),
    position,
    title: `Step ${position}`,
    description: "C2.4",
  }))
  return {
    id: randomUUID(),
    goalId,
    title: "C2.4 path",
    steps,
  }
}

describe("C2.4 — StepSkill repository (PostgreSQL)", () => {
  it("binds owned Steps to same-org Skills idempotently without Goal-Skill or table emptiness assumptions", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const ownedGoals = createDrizzleOwnedGoalRepository(db)
      const ownedPaths = createDrizzleOwnedLearningPathRepository(db)
      const unscopedGoals = createDrizzleGoalRepository(db)
      const unscopedPaths = createDrizzleLearningPathRepository(db)
      const catalog = createDrizzleOrganizationSkillRepository(db)
      const binds = createDrizzleStepSkillRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }, { now: NOW }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }, { now: NOW }))
      const user = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const userTwo = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
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
          userId: userTwo.id as string,
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
        userId: userTwo.id as string,
        organizationId: orgA.id as string,
      }
      const contextB: LearnerContext = {
        learnerId: learnerB.id as string,
        userId: user.id as string,
        organizationId: orgB.id as string,
      }
      const scopeA = { organizationId: contextA.organizationId, learnerId: contextA.learnerId }
      const scopeA2 = { organizationId: contextA2.organizationId, learnerId: contextA2.learnerId }
      const scopeB = { organizationId: contextB.organizationId, learnerId: contextB.learnerId }

      const goalA = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextA, ownedGoals)
      const goalA2 = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextA2, ownedGoals)
      const goalB = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextB, ownedGoals)
      const pathA = await ownedPaths.saveOwned(acceptedPath(goalA.id as string, 2), scopeA)
      const pathA2 = await ownedPaths.saveOwned(acceptedPath(goalA2.id as string, 1), scopeA2)
      const pathB = await ownedPaths.saveOwned(acceptedPath(goalB.id as string, 1), scopeB)
      const stepA0 = pathA.steps[0]?.id as string
      const stepA1 = pathA.steps[1]?.id as string
      const stepA2 = pathA2.steps[0]?.id as string
      const stepB = pathB.steps[0]?.id as string

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

      const legacyGoal = await unscopedGoals.save(
        createGoal({ ...fields, id: randomUUID() }, { now: NOW }),
      )
      const legacyPath = await unscopedPaths.save(acceptedPath(legacyGoal.id as string, 1))
      const legacyStep = legacyPath.steps[0]?.id as string

      const stepSkillsBefore = stepSkillKeys(await db.select().from(stepSkills))
      const goalSkillsBefore = goalSkillKeys(await db.select().from(goalSkills))
      const goalsBefore = (await db.select().from(goals)).length
      const pathsBefore = (await db.select().from(learningPaths)).length
      const stepsBefore = (await db.select().from(learningPathSteps)).length
      const evidenceBefore = (await db.select().from(evidence)).length

      const first = await bindOwnedStepSkill(
        {
          stepId: stepA0,
          skillId: skillA1.id,
          organizationId: "forged-org",
          learnerId: "forged-learner",
        },
        contextA,
        binds,
      )
      expect(first).toEqual({ stepId: stepA0, skillId: skillA1.id })
      const again = await bindOwnedStepSkill(
        { stepId: stepA0, skillId: skillA1.id },
        contextA,
        binds,
      )
      expect(again).toEqual(first)
      expect(
        (await db.select().from(stepSkills).where(eq(stepSkills.stepId, stepA0))).filter(
          (row) => row.skillId === skillA1.id,
        ),
      ).toHaveLength(1)

      await bindOwnedStepSkill({ stepId: stepA0, skillId: skillA2.id }, contextA, binds)
      expect(
        (await db.select().from(stepSkills).where(eq(stepSkills.stepId, stepA0))).length,
      ).toBe(2)
      await bindOwnedStepSkill({ stepId: stepA1, skillId: skillA1.id }, contextA, binds)
      expect(
        (await db.select().from(stepSkills).where(eq(stepSkills.skillId, skillA1.id))).length,
      ).toBe(2)

      const stepSkillsAfterSuccess = stepSkillKeys(await db.select().from(stepSkills))

      await expect(
        bindOwnedStepSkill({ stepId: stepA0, skillId: skillB.id }, contextA, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
      await expect(
        bindOwnedStepSkill({ stepId: stepB, skillId: skillA1.id }, contextA, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })
      await expect(
        bindOwnedStepSkill({ stepId: stepA2, skillId: skillA1.id }, contextA, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })
      await expect(
        bindOwnedStepSkill({ stepId: randomUUID(), skillId: skillA1.id }, contextA, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })
      await expect(
        bindOwnedStepSkill({ stepId: stepA0, skillId: randomUUID() }, contextA, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })
      await expect(
        bindOwnedStepSkill({ stepId: legacyStep, skillId: skillA1.id }, contextA, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })
      await expect(
        bindOwnedStepSkill({ stepId: stepA0, skillId: skillA1.id }, contextB, binds),
      ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })

      expect(stepSkillKeys(await db.select().from(stepSkills))).toEqual(stepSkillsAfterSuccess)
      expect(goalSkillKeys(await db.select().from(goalSkills))).toEqual(goalSkillsBefore)
      expect((await db.select().from(goals)).length).toBe(goalsBefore)
      expect((await db.select().from(learningPaths)).length).toBe(pathsBefore)
      expect((await db.select().from(learningPathSteps)).length).toBe(stepsBefore)
      expect((await db.select().from(evidence)).length).toBe(evidenceBefore)

      const added = stepSkillsAfterSuccess.filter((key) => !stepSkillsBefore.includes(key))
      expect(added.sort()).toEqual(
        [pairKey(stepA0, skillA1.id), pairKey(stepA0, skillA2.id), pairKey(stepA1, skillA1.id)].sort(),
      )

      await expect(
        db.insert(stepSkills).values({
          stepId: stepA0,
          skillId: randomUUID(),
        }),
      ).rejects.toThrow()
      expect(stepSkillKeys(await db.select().from(stepSkills))).toEqual(stepSkillsAfterSuccess)
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
