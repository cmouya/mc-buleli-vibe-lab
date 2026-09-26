import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { createOrganization } from "../../src/modules/identity/index.js"
import { createOrganizationSkill } from "../../src/modules/skills/index.js"
import {
  createDb,
  createDrizzleOrganizationRepository,
  createDrizzleOrganizationSkillRepository,
  createSqlClient,
  goalSkills,
  migrateDatabase,
  requireDatabaseUrl,
  stepSkills,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-26T00:00:00.000Z"

describe("C2.2 — OrganizationSkill repository (PostgreSQL)", () => {
  it("round-trips same-org Skills, isolates tenants, and never writes join tables", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const catalog = createDrizzleOrganizationSkillRepository(db)
      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }, { now: NOW }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }, { now: NOW }))
      const orgAId = orgA.id as string
      const orgBId = orgB.id as string

      const first = await catalog.save(
        createOrganizationSkill({ id: randomUUID(), organizationId: orgAId, name: "Python" }),
        orgAId,
      )
      expect(first.organizationId).toBe(orgAId)
      expect(first.name).toBe("Python")
      expect(await catalog.getByIdForOrganization(first.id, orgAId)).toEqual(first)

      const second = await catalog.save(
        createOrganizationSkill({
          id: randomUUID(),
          organizationId: orgAId,
          name: "Python",
          description: "same label",
        }),
        orgAId,
      )
      expect(second.id).not.toBe(first.id)
      expect(second.name).toBe("Python")

      const otherOrg = await catalog.save(
        createOrganizationSkill({ id: randomUUID(), organizationId: orgBId, name: "Python" }),
        orgBId,
      )
      expect(otherOrg.organizationId).toBe(orgBId)
      expect(await catalog.getByIdForOrganization(first.id, orgBId)).toBeNull()
      expect(await catalog.getByIdForOrganization(randomUUID(), orgAId)).toBeNull()

      const forgedId = randomUUID()
      const stamped = await catalog.save(
        createOrganizationSkill({
          id: forgedId,
          organizationId: orgBId,
          name: "Forged org field",
        }),
        orgAId,
      )
      expect(stamped.organizationId).toBe(orgAId)
      expect(await catalog.getByIdForOrganization(forgedId, orgAId)).toEqual(stamped)
      expect(await catalog.getByIdForOrganization(forgedId, orgBId)).toBeNull()

      await expect(
        catalog.save(
          createOrganizationSkill({
            id: randomUUID(),
            organizationId: randomUUID(),
            name: "Missing org",
          }),
          randomUUID(),
        ),
      ).rejects.toThrow()

      await expect(catalog.save(first, orgAId)).rejects.toThrow()

      expect(await db.select().from(goalSkills).where(eq(goalSkills.skillId, first.id))).toEqual([])
      expect(await db.select().from(stepSkills).where(eq(stepSkills.skillId, first.id))).toEqual([])
      expect(await db.select().from(goalSkills).where(eq(goalSkills.skillId, stamped.id))).toEqual([])
      expect(await db.select().from(stepSkills).where(eq(stepSkills.skillId, stamped.id))).toEqual([])
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
