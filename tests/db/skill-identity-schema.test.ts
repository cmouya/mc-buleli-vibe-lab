import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import {
  createDb,
  createSqlClient,
  evidence,
  goalSkills,
  goals,
  learners,
  learningPathSteps,
  learningPaths,
  migrateDatabase,
  organizations,
  requireDatabaseUrl,
  skills,
  stepSkills,
  users,
} from "../../src/infra/db/index.js"

/**
 * C2.1 structural schema tests only.
 * Cross-org Goal↔Skill INSERT documents Option A (FKs are not tenant authority).
 * It is not application authorization.
 */

async function org(db: ReturnType<typeof createDb>, name: string) {
  const id = randomUUID()
  await db.insert(organizations).values({ id, name })
  return id
}

async function user(db: ReturnType<typeof createDb>) {
  const id = randomUUID()
  await db.insert(users).values({ id })
  return id
}

async function learner(db: ReturnType<typeof createDb>, organizationId: string, userId: string) {
  const id = randomUUID()
  await db.insert(learners).values({ id, organizationId, userId })
  return id
}

async function ownedGoal(
  db: ReturnType<typeof createDb>,
  organizationId: string,
  learnerId: string,
) {
  const id = randomUUID()
  await db.insert(goals).values({
    id,
    statement: "C2.1 goal",
    level: "debutant",
    hoursPerWeek: "4",
    intent: "personnel",
    status: "draft",
    organizationId,
    learnerId,
  })
  return id
}

async function pathWithStep(db: ReturnType<typeof createDb>, goalId: string) {
  const pathId = randomUUID()
  const stepId = randomUUID()
  await db.insert(learningPaths).values({ id: pathId, goalId, title: "Path" })
  await db.insert(learningPathSteps).values({
    id: stepId,
    pathId,
    position: 0,
    title: "Step",
    description: "",
  })
  return { pathId, stepId }
}

async function skillRow(
  db: ReturnType<typeof createDb>,
  organizationId: string,
  name: string,
  description?: string,
) {
  const id = randomUUID()
  await db.insert(skills).values({
    id,
    organizationId,
    name,
    ...(description !== undefined ? { description } : {}),
  })
  return id
}

describe("C2.1 — Skill Identity schema (PostgreSQL)", () => {
  it("persists organization-scoped Skills and rejects incomplete catalog rows", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgA = await org(db, "Org A catalog")
      const skillId = await skillRow(db, orgA, "Python", "optional")
      const rows = await db.select().from(skills).where(eq(skills.id, skillId))
      expect(rows).toHaveLength(1)
      expect(rows[0]?.organizationId).toBe(orgA)
      expect(rows[0]?.name).toBe("Python")
      expect(rows[0]?.description).toBe("optional")

      await expect(
        db.insert(skills).values({
          id: randomUUID(),
          name: "No org",
          organizationId: undefined as unknown as string,
        }),
      ).rejects.toThrow()
      await expect(
        db.insert(skills).values({
          id: randomUUID(),
          organizationId: orgA,
          name: undefined as unknown as string,
        }),
      ).rejects.toThrow()

      const label = "Shared label"
      const id1 = await skillRow(db, orgA, label)
      const id2 = await skillRow(db, orgA, label)
      expect(id1).not.toBe(id2)
      const orgB = await org(db, "Org B catalog")
      const id3 = await skillRow(db, orgB, label)
      expect(id3).not.toBe(id1)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("supports many-to-many joins and rejects duplicate pairs structurally", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgId = await org(db, "Org M2M")
      const userId = await user(db)
      const learnerId = await learner(db, orgId, userId)
      const goalOne = await ownedGoal(db, orgId, learnerId)
      const goalTwo = await ownedGoal(db, orgId, learnerId)
      const skillOne = await skillRow(db, orgId, "A")
      const skillTwo = await skillRow(db, orgId, "B")
      const { stepId: stepOne } = await pathWithStep(db, goalOne)
      const { stepId: stepTwo } = await pathWithStep(db, goalTwo)

      await db.insert(goalSkills).values([
        { goalId: goalOne, skillId: skillOne },
        { goalId: goalOne, skillId: skillTwo },
        { goalId: goalTwo, skillId: skillOne },
      ])
      await db.insert(stepSkills).values([
        { stepId: stepOne, skillId: skillOne },
        { stepId: stepOne, skillId: skillTwo },
        { stepId: stepTwo, skillId: skillOne },
      ])

      const goalOneSkills = await db.select().from(goalSkills).where(eq(goalSkills.goalId, goalOne))
      expect(goalOneSkills).toHaveLength(2)
      const skillOneGoals = await db.select().from(goalSkills).where(eq(goalSkills.skillId, skillOne))
      expect(skillOneGoals).toHaveLength(2)
      const stepOneSkills = await db.select().from(stepSkills).where(eq(stepSkills.stepId, stepOne))
      expect(stepOneSkills).toHaveLength(2)
      const skillOneSteps = await db.select().from(stepSkills).where(eq(stepSkills.skillId, skillOne))
      expect(skillOneSteps).toHaveLength(2)

      await expect(
        db.insert(goalSkills).values({ goalId: goalOne, skillId: skillOne }),
      ).rejects.toThrow()
      await expect(
        db.insert(stepSkills).values({ stepId: stepOne, skillId: skillOne }),
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("cascades join rows without deleting Skills/Goals/Steps and restricts Organization delete", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgId = await org(db, "Org cascade")
      const userId = await user(db)
      const learnerId = await learner(db, orgId, userId)

      const goalNoPath = await ownedGoal(db, orgId, learnerId)
      const skillForGoal = await skillRow(db, orgId, "Goal-bound")
      await db.insert(goalSkills).values({ goalId: goalNoPath, skillId: skillForGoal })
      await db.delete(goals).where(eq(goals.id, goalNoPath))
      expect(await db.select().from(goalSkills).where(eq(goalSkills.goalId, goalNoPath))).toEqual([])
      expect(await db.select().from(skills).where(eq(skills.id, skillForGoal))).toHaveLength(1)

      const goalForStep = await ownedGoal(db, orgId, learnerId)
      const { pathId, stepId } = await pathWithStep(db, goalForStep)
      const skillForStep = await skillRow(db, orgId, "Step-bound")
      await db.insert(stepSkills).values({ stepId, skillId: skillForStep })
      await db.delete(learningPathSteps).where(eq(learningPathSteps.id, stepId))
      expect(await db.select().from(stepSkills).where(eq(stepSkills.stepId, stepId))).toEqual([])
      expect(await db.select().from(skills).where(eq(skills.id, skillForStep))).toHaveLength(1)
      expect(await db.select().from(learningPaths).where(eq(learningPaths.id, pathId))).toHaveLength(
        1,
      )

      const goalKept = await ownedGoal(db, orgId, learnerId)
      const { stepId: stepKept } = await pathWithStep(db, goalKept)
      const skillDeleted = await skillRow(db, orgId, "To delete")
      await db.insert(goalSkills).values({ goalId: goalKept, skillId: skillDeleted })
      await db.insert(stepSkills).values({ stepId: stepKept, skillId: skillDeleted })
      await db.delete(skills).where(eq(skills.id, skillDeleted))
      expect(await db.select().from(goalSkills).where(eq(goalSkills.skillId, skillDeleted))).toEqual(
        [],
      )
      expect(await db.select().from(stepSkills).where(eq(stepSkills.skillId, skillDeleted))).toEqual(
        [],
      )
      expect(await db.select().from(goals).where(eq(goals.id, goalKept))).toHaveLength(1)
      expect(await db.select().from(learningPathSteps).where(eq(learningPathSteps.id, stepKept))).toHaveLength(
        1,
      )

      await expect(db.delete(organizations).where(eq(organizations.id, orgId))).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("keeps zero-binding durable rows valid and allows Option A cross-org join at SQL only", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgA = await org(db, "Org A option A")
      const orgB = await org(db, "Org B option A")
      const userId = await user(db)
      const learnerA = await learner(db, orgA, userId)
      const goalA = await ownedGoal(db, orgA, learnerA)
      const { pathId, stepId } = await pathWithStep(db, goalA)
      const evidenceId = randomUUID()
      await db.insert(evidence).values({
        id: evidenceId,
        stepId,
        type: "quiz_attempt",
        score: "1",
        maxScore: "2",
        passed: false,
        answers: [],
        recordedAt: "2026-09-25T00:00:00.000Z",
      })

      expect(await db.select().from(goalSkills).where(eq(goalSkills.goalId, goalA))).toEqual([])
      expect(await db.select().from(stepSkills).where(eq(stepSkills.stepId, stepId))).toEqual([])
      expect(await db.select().from(goals).where(eq(goals.id, goalA))).toHaveLength(1)
      expect(await db.select().from(learningPaths).where(eq(learningPaths.id, pathId))).toHaveLength(
        1,
      )
      expect(await db.select().from(learningPathSteps).where(eq(learningPathSteps.id, stepId))).toHaveLength(
        1,
      )
      expect(await db.select().from(evidence).where(eq(evidence.id, evidenceId))).toHaveLength(1)

      const skillB = await skillRow(db, orgB, "Foreign skill")
      await db.insert(goalSkills).values({ goalId: goalA, skillId: skillB })
      const cross = await db.select().from(goalSkills).where(eq(goalSkills.goalId, goalA))
      expect(cross).toHaveLength(1)
      expect(cross[0]?.skillId).toBe(skillB)
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
