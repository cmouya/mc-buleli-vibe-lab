import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { createGoal, markGoalAnalyzed, confirmGoal } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleOrganizationRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-12T10:00:00.000Z"

describe("M4.2 — Goal repository (PostgreSQL)", () => {
  it("migrates, saves, and reads draft/analyzed/confirmed goals", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const repo = createDrizzleGoalRepository(db)

      const draft = createGoal({
        statement: "Draft goal",
        level: "debutant",
        hoursPerWeek: 4,
        intent: "personnel",
        id: randomUUID(),
      })
      const savedDraft = await repo.save(draft)
      expect(savedDraft.status).toBe("draft")
      expect(await repo.getById(savedDraft.id as string)).toEqual(savedDraft)

      const analyzed = markGoalAnalyzed(
        createGoal({
          statement: "Analyzed goal",
          level: "intermediaire",
          hoursPerWeek: 6,
          intent: "academique",
          id: randomUUID(),
        }),
        { now: NOW },
      )
      const savedAnalyzed = await repo.save(analyzed)
      expect(savedAnalyzed.status).toBe("analyzed")
      expect(savedAnalyzed.analyzedAt).toBe(NOW)

      const confirmed = confirmGoal(
        markGoalAnalyzed(
          createGoal({
            statement: "Confirmed goal",
            level: "avance",
            hoursPerWeek: 8,
            intent: "professionnel",
            id: randomUUID(),
          }),
          { now: NOW },
        ),
        { now: NOW },
      )
      const savedConfirmed = await repo.save(confirmed)
      expect(savedConfirmed.status).toBe("confirmed")
      expect(savedConfirmed.confirmedAt).toBe(NOW)
      expect(savedConfirmed.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
      expect(savedDraft).not.toHaveProperty("organizationId")
      expect(savedDraft).not.toHaveProperty("learnerId")

      await expect(repo.getById(randomUUID())).resolves.toBeNull()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects invalid status via CHECK constraint", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      await expect(
        client`
          INSERT INTO goals (id, statement, level, hours_per_week, intent, status)
          VALUES (
            ${randomUUID()}::uuid,
            'Bad status',
            'debutant',
            5,
            'professionnel',
            'not-a-status'
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})

describe("M6.1 C3 — Goal ownership (PostgreSQL)", () => {
  it("round-trips a same-org owned Goal and keeps multi-org Learners isolated", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const goalsRepo = createDrizzleGoalRepository(db)
      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }))
      const user = await users.save(createUser({ id: randomUUID() }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: user.id as string,
        }),
      )
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: user.id as string,
        }),
      )
      const ownedA = await goalsRepo.save({
        ...createGoal({
          statement: "Owned A",
          level: "debutant",
          hoursPerWeek: 4,
          intent: "personnel",
          id: randomUUID(),
        }),
        organizationId: orgA.id as string,
        learnerId: learnerA.id as string,
      })
      const ownedB = await goalsRepo.save({
        ...createGoal({
          statement: "Owned B",
          level: "debutant",
          hoursPerWeek: 4,
          intent: "personnel",
          id: randomUUID(),
        }),
        organizationId: orgB.id as string,
        learnerId: learnerB.id as string,
      })
      expect(ownedA.organizationId).toBe(orgA.id)
      expect(ownedA.learnerId).toBe(learnerA.id)
      expect(ownedB.organizationId).toBe(orgB.id)
      expect(ownedB.learnerId).toBe(learnerB.id)
      expect(await goalsRepo.getById(ownedA.id as string)).toEqual(ownedA)

      await expect(
        goalsRepo.save({
          ...createGoal({
            statement: "Cross org",
            level: "debutant",
            hoursPerWeek: 4,
            intent: "personnel",
            id: randomUUID(),
          }),
          organizationId: orgA.id as string,
          learnerId: learnerB.id as string,
        }),
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects unknown FKs and partial ownership at the database", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const goalsRepo = createDrizzleGoalRepository(db)
      const org = await orgs.save(createOrganization({ name: "Acme", id: randomUUID() }))
      const user = await users.save(createUser({ id: randomUUID() }))
      const learner = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: org.id as string,
          userId: user.id as string,
        }),
      )

      await expect(
        goalsRepo.save({
          ...createGoal({
            statement: "Unknown org",
            level: "debutant",
            hoursPerWeek: 4,
            intent: "personnel",
            id: randomUUID(),
          }),
          organizationId: randomUUID(),
          learnerId: learner.id as string,
        }),
      ).rejects.toThrow()
      await expect(
        goalsRepo.save({
          ...createGoal({
            statement: "Unknown learner",
            level: "debutant",
            hoursPerWeek: 4,
            intent: "personnel",
            id: randomUUID(),
          }),
          organizationId: org.id as string,
          learnerId: randomUUID(),
        }),
      ).rejects.toThrow()

      await expect(
        client`
          INSERT INTO goals (id, statement, level, hours_per_week, intent, status, organization_id, learner_id)
          VALUES (
            ${randomUUID()}::uuid,
            'Partial org',
            'debutant',
            5,
            'professionnel',
            'draft',
            ${org.id}::uuid,
            NULL
          )
        `,
      ).rejects.toThrow()
      await expect(
        client`
          INSERT INTO goals (id, statement, level, hours_per_week, intent, status, organization_id, learner_id)
          VALUES (
            ${randomUUID()}::uuid,
            'Partial learner',
            'debutant',
            5,
            'professionnel',
            'draft',
            NULL,
            ${learner.id}::uuid
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
