import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { DomainError } from "../../src/modules/shared/index.js"
import { confirmGoal, createGoal, markGoalAnalyzed } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleLearningPathRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-12T16:00:00.000Z"
const fields = {
  statement: "Owned path goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function acceptedPath(goalId: string, extra?: Partial<AcceptedLearningPath>): AcceptedLearningPath {
  return {
    id: randomUUID(),
    goalId,
    title: "IA pour développer votre activité",
    summary: "accepted",
    sourcePathId: "ia-pro",
    steps: [
      {
        id: randomUUID(),
        position: 0,
        title: "Fondamentaux",
        description: "Bases",
        sourceStepId: "ia-1",
      },
      {
        id: randomUUID(),
        position: 1,
        title: "ChatGPT",
        description: "",
        sourceStepId: "ia-2",
      },
    ],
    ...extra,
  }
}

describe("M6.2 C2 — Owned Learning Path repository (PostgreSQL)", () => {
  it("persists Path+Steps only for the owned Goal and fails closed otherwise", async () => {
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
      const legacyGoals = createDrizzleGoalRepository(db)
      const legacyPaths = createDrizzleLearningPathRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }))
      const userU = await users.save(createUser({ id: randomUUID() }))
      const userTwo = await users.save(createUser({ id: randomUUID() }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userU.id as string,
        }),
      )
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: userU.id as string,
        }),
      )
      const learnerA2 = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userTwo.id as string,
        }),
      )

      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: userU.id as string,
        organizationId: orgA.id as string,
      }
      const contextB: LearnerContext = {
        learnerId: learnerB.id as string,
        userId: userU.id as string,
        organizationId: orgB.id as string,
      }
      const contextA2: LearnerContext = {
        learnerId: learnerA2.id as string,
        userId: userTwo.id as string,
        organizationId: orgA.id as string,
      }
      const scopeA = { organizationId: contextA.organizationId, learnerId: contextA.learnerId }
      const scopeB = { organizationId: contextB.organizationId, learnerId: contextB.learnerId }
      const scopeA2 = { organizationId: contextA2.organizationId, learnerId: contextA2.learnerId }

      const goalA = await persistOwnedGoal({ ...fields, statement: "GA" }, contextA, ownedGoals)
      const goalB = await persistOwnedGoal({ ...fields, statement: "GB" }, contextB, ownedGoals)

      const savedA = await ownedPaths.saveOwned(acceptedPath(goalA.id as string), scopeA)
      expect(savedA.goalId).toBe(goalA.id)
      expect(savedA.title).toBe("IA pour développer votre activité")
      expect(savedA.summary).toBe("accepted")
      expect(savedA.sourcePathId).toBe("ia-pro")
      expect(savedA.steps.map((step) => step.title)).toEqual(["Fondamentaux", "ChatGPT"])
      expect(savedA.steps.map((step) => step.position)).toEqual([0, 1])

      const savedB = await ownedPaths.saveOwned(acceptedPath(goalB.id as string), scopeB)
      expect(savedB.goalId).toBe(goalB.id)

      const deniedB = acceptedPath(goalA.id as string)
      const deniedLearner = acceptedPath(goalA.id as string)
      const deniedGoalB = acceptedPath(goalB.id as string)
      const unknownPath = acceptedPath(randomUUID())

      await expect(ownedPaths.saveOwned(deniedB, scopeB)).rejects.toMatchObject({
        code: "GOAL_NOT_FOUND",
        message: "Goal not found",
      })
      await expect(ownedPaths.saveOwned(deniedLearner, scopeA2)).rejects.toMatchObject({
        code: "GOAL_NOT_FOUND",
        message: "Goal not found",
      })
      await expect(ownedPaths.saveOwned(deniedGoalB, scopeA)).rejects.toMatchObject({
        code: "GOAL_NOT_FOUND",
        message: "Goal not found",
      })
      const unknownFailure = ownedPaths.saveOwned(unknownPath, scopeA)
      const inaccessibleFailure = ownedPaths.saveOwned(acceptedPath(goalB.id as string), scopeA)
      await expect(unknownFailure).rejects.toMatchObject({
        code: "GOAL_NOT_FOUND",
        message: "Goal not found",
      })
      await expect(inaccessibleFailure).rejects.toMatchObject({
        code: "GOAL_NOT_FOUND",
        message: "Goal not found",
      })

      const [{ countA }] = await client<[{ countA: number }]>`
        SELECT count(*)::int AS "countA" FROM learning_paths WHERE id = ${deniedB.id}::uuid
      `
      const [{ countLearner }] = await client<[{ countLearner: number }]>`
        SELECT count(*)::int AS "countLearner" FROM learning_paths WHERE id = ${deniedLearner.id}::uuid
      `
      const [{ countGoalB }] = await client<[{ countGoalB: number }]>`
        SELECT count(*)::int AS "countGoalB" FROM learning_paths WHERE id = ${deniedGoalB.id}::uuid
      `
      const [{ countUnknown }] = await client<[{ countUnknown: number }]>`
        SELECT count(*)::int AS "countUnknown" FROM learning_paths WHERE id = ${unknownPath.id}::uuid
      `
      expect(countA).toBe(0)
      expect(countLearner).toBe(0)
      expect(countGoalB).toBe(0)
      expect(countUnknown).toBe(0)

      const legacy = await legacyGoals.save(
        confirmGoal(
          markGoalAnalyzed(
            createGoal({
              statement: "Legacy unowned",
              level: "debutant",
              hoursPerWeek: 3,
              intent: "personnel",
              id: randomUUID(),
            }),
            { now: NOW },
          ),
          { now: NOW },
        ),
      )
      const legacyPath = acceptedPath(legacy.id as string)
      await expect(ownedPaths.saveOwned(legacyPath, scopeA)).rejects.toBeInstanceOf(DomainError)
      const [{ countLegacy }] = await client<[{ countLegacy: number }]>`
        SELECT count(*)::int AS "countLegacy" FROM learning_paths WHERE id = ${legacyPath.id}::uuid
      `
      expect(countLegacy).toBe(0)

      const rolling = acceptedPath(goalA.id as string, {
        steps: [
          {
            id: randomUUID(),
            position: 0,
            title: "Keep",
            description: "",
          },
          {
            id: randomUUID(),
            position: -1,
            title: "Bad",
            description: "",
          },
        ],
      })
      await expect(ownedPaths.saveOwned(rolling, scopeA)).rejects.toThrow()
      const [{ countRolling }] = await client<[{ countRolling: number }]>`
        SELECT count(*)::int AS "countRolling" FROM learning_paths WHERE id = ${rolling.id}::uuid
      `
      const [{ countRollingSteps }] = await client<[{ countRollingSteps: number }]>`
        SELECT count(*)::int AS "countRollingSteps" FROM learning_path_steps WHERE path_id = ${rolling.id}::uuid
      `
      expect(countRolling).toBe(0)
      expect(countRollingSteps).toBe(0)

      const legacyAccepted = acceptedPath(legacy.id as string)
      const fromLegacy = await legacyPaths.save(legacyAccepted)
      expect(fromLegacy.goalId).toBe(legacy.id)
      expect(await legacyPaths.getById(fromLegacy.id)).toEqual(fromLegacy)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("authorizes saveOwned with a triple-key Goal WHERE, not global getById", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/infra/db/owned-learning-path-repository.ts",
      ),
      "utf8",
    )
    expect(source).toMatch(/eq\(goals\.id, path\.goalId\)/)
    expect(source).toMatch(/eq\(goals\.organizationId, scope\.organizationId\)/)
    expect(source).toMatch(/eq\(goals\.learnerId, scope\.learnerId\)/)
    expect(source).toMatch(/db\.transaction/)
    expect(source).not.toMatch(/createDrizzleGoalRepository/)
    expect(source).not.toMatch(/getById\(/)
    expect(source).not.toMatch(/organization_id/)
    expect(source).not.toMatch(/learner_id/)
  })
})
