import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { createGoal } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import { persistOwnedGoal, getOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const fields = {
  statement: "Owned goal",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

describe("M6.1 C5 — Owned Goal repository (PostgreSQL)", () => {
  it("scopes owned save/read by organization and learner, including Model C and legacy fail-closed", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const legacyGoals = createDrizzleGoalRepository(db)
      const ownedGoals = createDrizzleOwnedGoalRepository(db)

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

      const goalA = await persistOwnedGoal(
        { ...fields, statement: "GA", organizationId: orgB.id as string, learnerId: learnerB.id as string },
        contextA,
        ownedGoals,
      )
      expect(goalA.organizationId).toBe(orgA.id)
      expect(goalA.learnerId).toBe(learnerA.id)

      const goalB = await persistOwnedGoal({ ...fields, statement: "GB" }, contextB, ownedGoals)

      expect(await getOwnedGoal(goalA.id as string, contextA, ownedGoals)).toEqual(goalA)
      expect(await getOwnedGoal(goalB.id as string, contextB, ownedGoals)).toEqual(goalB)
      expect(await getOwnedGoal(goalA.id as string, contextB, ownedGoals)).toBeNull()
      expect(await getOwnedGoal(goalB.id as string, contextA, ownedGoals)).toBeNull()
      expect(await getOwnedGoal(goalA.id as string, contextA2, ownedGoals)).toBeNull()

      const unknown = await getOwnedGoal(randomUUID(), contextA, ownedGoals)
      expect(unknown).toBeNull()

      const legacy = await legacyGoals.save(
        createGoal({
          statement: "Legacy unowned",
          level: "debutant",
          hoursPerWeek: 3,
          intent: "personnel",
          id: randomUUID(),
        }),
      )
      expect(legacy).not.toHaveProperty("organizationId")
      expect(await legacyGoals.getById(legacy.id as string)).toEqual(legacy)
      expect(await getOwnedGoal(legacy.id as string, contextA, ownedGoals)).toBeNull()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("implements owned read with a triple-key WHERE, not generic getById", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../src/infra/db/goal-repository.ts"),
      "utf8",
    )
    const owned = source.slice(source.indexOf("export function createDrizzleOwnedGoalRepository"))
    expect(owned).toMatch(/eq\(goals\.id/)
    expect(owned).toMatch(/eq\(goals\.organizationId/)
    expect(owned).toMatch(/eq\(goals\.learnerId/)
    expect(owned).toMatch(/\band\(/)
    expect(owned).not.toMatch(/getById\(/)
  })
})
