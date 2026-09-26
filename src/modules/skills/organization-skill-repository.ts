import type { OrganizationSkill } from "./organization-skill.js"

/** Tenant-scoped Skill catalog persistence. skillId is not tenant authority. */
export interface OrganizationSkillRepository {
  save(skill: OrganizationSkill, organizationId: string): Promise<OrganizationSkill>
  getByIdForOrganization(
    skillId: string,
    organizationId: string,
  ): Promise<OrganizationSkill | null>
}
