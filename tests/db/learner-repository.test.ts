import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import {
  createDb,
  createDrizzleLearnerRepository,
  createDrizzleOrganizationMembershipRepository,
  createDrizzleOrganizationRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-13T00:00:00.000Z"

describe("M6.1 C2 — Learner repository (PostgreSQL)", () => {
  it("persists a Learner and reads it by organization + user without a membership row", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const memberships = createDrizzleOrganizationMembershipRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const org = await orgs.save(createOrganization({ name: "Acme", id: randomUUID() }, { now: NOW }))
      const user = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const saved = await learners.save(
        createLearner(
          {
            id: randomUUID(),
            organizationId: org.id as string,
            userId: user.id as string,
          },
          { now: NOW },
        ),
      )
      expect(saved.organizationId).toBe(org.id)
      expect(saved.userId).toBe(user.id)
      expect(saved.createdAt).toBe(NOW)
      const loaded = await learners.getByOrganizationAndUserId(org.id as string, user.id as string)
      expect(loaded).toEqual(saved)
      expect(await memberships.listByUserId(user.id as string)).toEqual([])
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("allows the same user to have distinct Learners in two organizations (Model C)", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
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
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: user.id as string,
        }),
      )
      expect(learnerA.id).not.toBe(learnerB.id)
      expect(await learners.getByOrganizationAndUserId(orgA.id as string, user.id as string)).toEqual(
        learnerA,
      )
      expect(await learners.getByOrganizationAndUserId(orgB.id as string, user.id as string)).toEqual(
        learnerB,
      )
      expect(await learners.getByOrganizationAndUserId(randomUUID(), user.id as string)).toBeNull()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects duplicate (organization_id, user_id) and unknown FKs", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const org = await orgs.save(createOrganization({ name: "Acme", id: randomUUID() }))
      const user = await users.save(createUser({ id: randomUUID() }))
      const pair = {
        organizationId: org.id as string,
        userId: user.id as string,
      }
      await learners.save(createLearner({ ...pair, id: randomUUID() }))
      await expect(learners.save(createLearner({ ...pair, id: randomUUID() }))).rejects.toThrow()
      await expect(
        learners.save(
          createLearner({
            id: randomUUID(),
            organizationId: randomUUID(),
            userId: user.id as string,
          }),
        ),
      ).rejects.toThrow()
      await expect(
        learners.save(
          createLearner({
            id: randomUUID(),
            organizationId: org.id as string,
            userId: randomUUID(),
          }),
        ),
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
