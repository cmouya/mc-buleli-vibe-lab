/**
 * Persist and read organization-scoped Skill catalog entries.
 * Trusted organizationId is tenant authority. Client organizationId is not.
 */

import {
  createOrganizationSkill,
  type OrganizationSkill,
  type OrganizationSkillRepository,
} from "../modules/skills/index.js"

export type { OrganizationSkill, OrganizationSkillRepository }

export interface PersistOrganizationSkillInput {
  id?: string
  name: string
  description?: string
  organizationId?: string
}

function withId(id: string | undefined): string {
  const trimmed = id?.trim() ?? ""
  return trimmed || globalThis.crypto.randomUUID()
}

export async function persistOrganizationSkill(
  input: PersistOrganizationSkillInput,
  organizationId: string,
  repository: OrganizationSkillRepository,
): Promise<OrganizationSkill> {
  const skill = createOrganizationSkill({
    id: withId(input.id),
    organizationId,
    name: input.name,
    description: input.description,
  })
  return repository.save(skill, organizationId)
}

export async function getOrganizationSkill(
  skillId: string,
  organizationId: string,
  repository: OrganizationSkillRepository,
): Promise<OrganizationSkill | null> {
  return repository.getByIdForOrganization(skillId, organizationId)
}
