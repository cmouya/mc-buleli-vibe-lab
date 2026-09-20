/**
 * ADR-020 Skill identity — organization-scoped catalog capability.
 * Distinct from conceptual Phase 0 Skill (createSkill) which has no tenant.
 * Skill ≠ Goal ≠ LearnerSkill ≠ Mastery. Identity is Skill id, not label.
 */

import { DomainError } from "../shared/domain-error.js"

export interface OrganizationSkill {
  id: string
  organizationId: string
  name: string
  description?: string
}

export interface CreateOrganizationSkillInput {
  id: string
  organizationId: string
  name: string
  description?: string
}

/**
 * Create an organization-scoped Skill identity. Requires id, organizationId, name.
 * Does not persist. Does not enforce label uniqueness.
 */
export function createOrganizationSkill(input: CreateOrganizationSkillInput): OrganizationSkill {
  const id = input.id.trim()
  const organizationId = input.organizationId.trim()
  const name = input.name.trim()

  if (!id) {
    throw new DomainError("SKILL_EMPTY_ID", "Skill id must be non-empty")
  }
  if (!organizationId) {
    throw new DomainError("SKILL_EMPTY_ORGANIZATION_ID", "Skill organizationId must be non-empty")
  }
  if (!name) {
    throw new DomainError("SKILL_EMPTY_NAME", "Skill name must be non-empty")
  }

  const skill: OrganizationSkill = { id, organizationId, name }

  if (input.description !== undefined) {
    skill.description = input.description
  }

  return skill
}

export function isOrganizationSkill(value: unknown): value is OrganizationSkill {
  if (value === null || typeof value !== "object") {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.organizationId === "string" &&
    typeof record.name === "string" &&
    !("masteryLevel" in record) &&
    !("statement" in record) &&
    !("status" in record) &&
    !("requiredLevel" in record)
  )
}

/**
 * Trusted tenant check: Skill catalog scope must match the caller's organization.
 * Does not use Skill name as authority.
 */
export function assertSkillMatchesOrganization(
  skill: OrganizationSkill,
  organizationId: string,
): void {
  const expected = organizationId.trim()
  if (!expected) {
    throw new DomainError("SKILL_EMPTY_ORGANIZATION_ID", "Skill organizationId must be non-empty")
  }
  if (skill.organizationId !== expected) {
    throw new DomainError("SKILL_ORGANIZATION_MISMATCH", "Skill does not belong to this organization")
  }
}
