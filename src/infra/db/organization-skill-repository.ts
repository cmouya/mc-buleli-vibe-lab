import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type {
  OrganizationSkill,
  OrganizationSkillRepository,
} from "../../modules/skills/index.js"
import { skills } from "./schema.js"
import * as schema from "./schema.js"

function requireId(id: string | undefined, label: string): string {
  if (!id) {
    throw new Error(`${label}.id is required before save`)
  }
  return id
}

function requireOrganizationId(organizationId: string): string {
  const id = organizationId.trim()
  if (!id) {
    throw new Error("organizationId is required")
  }
  return id
}

function toOrganizationSkill(row: typeof skills.$inferSelect): OrganizationSkill {
  const skill: OrganizationSkill = {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
  }
  if (row.description != null) {
    skill.description = row.description
  }
  return skill
}

export function createDrizzleOrganizationSkillRepository(
  db: PostgresJsDatabase<typeof schema>,
): OrganizationSkillRepository {
  return {
    async save(skill, organizationId) {
      const id = requireId(skill.id, "OrganizationSkill")
      const trustedOrg = requireOrganizationId(organizationId)
      await db.insert(skills).values({
        id,
        organizationId: trustedOrg,
        name: skill.name,
        description: skill.description,
      })
      const saved = await db
        .select()
        .from(skills)
        .where(and(eq(skills.id, id), eq(skills.organizationId, trustedOrg)))
      if (!saved[0]) {
        throw new Error("OrganizationSkill save did not persist")
      }
      return toOrganizationSkill(saved[0])
    },

    async getByIdForOrganization(skillId, organizationId) {
      const trustedOrg = requireOrganizationId(organizationId)
      const rows = await db
        .select()
        .from(skills)
        .where(and(eq(skills.id, skillId), eq(skills.organizationId, trustedOrg)))
      return rows[0] ? toOrganizationSkill(rows[0]) : null
    },
  }
}
