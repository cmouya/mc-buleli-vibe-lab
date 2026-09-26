import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  getOrganizationSkill,
  persistOrganizationSkill,
} from "../../../src/application/persist-organization-skill.js"
import type {
  OrganizationSkill,
  OrganizationSkillRepository,
} from "../../../src/modules/skills/index.js"

function memorySkills(): OrganizationSkillRepository & { rows: OrganizationSkill[] } {
  const rows: OrganizationSkill[] = []
  return {
    rows,
    async save(skill, organizationId) {
      const owned: OrganizationSkill = { ...skill, organizationId }
      if (skill.description !== undefined) {
        owned.description = skill.description
      } else {
        delete owned.description
      }
      rows.push(owned)
      return owned
    },
    async getByIdForOrganization(skillId, organizationId) {
      return (
        rows.find((skill) => skill.id === skillId && skill.organizationId === organizationId) ??
        null
      )
    },
  }
}

describe("application — persistOrganizationSkill / getOrganizationSkill", () => {
  it("stamps trusted organizationId and ignores forged input organizationId", async () => {
    const repository = memorySkills()
    const saved = await persistOrganizationSkill(
      {
        id: "skill-1",
        name: "Python",
        description: "label",
        organizationId: "org-forged",
      },
      "org-a",
      repository,
    )
    expect(saved.id).toBe("skill-1")
    expect(saved.name).toBe("Python")
    expect(saved.description).toBe("label")
    expect(saved.organizationId).toBe("org-a")
    expect(saved.organizationId).not.toBe("org-forged")
    expect(repository.rows[0]?.organizationId).toBe("org-a")
  })

  it("returns null for unknown and cross-organization Skill ids without leaking", async () => {
    const repository = memorySkills()
    const saved = await persistOrganizationSkill({ id: "skill-a", name: "SQL" }, "org-a", repository)
    expect(await getOrganizationSkill(saved.id, "org-a", repository)).toEqual(saved)
    expect(await getOrganizationSkill(saved.id, "org-b", repository)).toBeNull()
    expect(await getOrganizationSkill("missing-skill", "org-a", repository)).toBeNull()
  })

  it("keeps persistOrganizationSkill free of infrastructure and server stacks", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../src/application/persist-organization-skill.ts",
      ),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
