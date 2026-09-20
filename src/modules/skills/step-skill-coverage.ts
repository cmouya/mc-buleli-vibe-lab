/**
 * ADR-020 Step → Skill coverage. Many-to-many.
 * Coverage means the Step concerns this Skill. It is not Mastery.
 * Step is not given organizationId; tenant proof uses Goal-rooted trusted organization.
 */

import { DomainError } from "../shared/domain-error.js"
import {
  assertSkillMatchesOrganization,
  type OrganizationSkill,
} from "./organization-skill.js"

export interface StepSkillCoverage {
  stepId: string
  skillId: string
}

export interface CreateStepSkillCoverageInput {
  stepId: string
  skillId: string
}

export interface BindStepSkillCoverageInput {
  stepId: string
  skill: OrganizationSkill
  /** Trusted organization of the Goal that owns the Step's Path. Not a Step tenant column. */
  trustedOrganizationId: string
}

function requireId(value: string, code: string, message: string): string {
  const id = value.trim()
  if (!id) {
    throw new DomainError(code, message)
  }
  return id
}

/** Coverage pair only. Tenant check belongs on bindStepSkillCoverage. */
export function createStepSkillCoverage(input: CreateStepSkillCoverageInput): StepSkillCoverage {
  return {
    stepId: requireId(input.stepId, "STEP_SKILL_EMPTY_STEP_ID", "stepId must be non-empty"),
    skillId: requireId(input.skillId, "STEP_SKILL_EMPTY_SKILL_ID", "skillId must be non-empty"),
  }
}

/**
 * Bind Step coverage to an organization-scoped Skill under Goal-rooted trusted organization.
 */
export function bindStepSkillCoverage(input: BindStepSkillCoverageInput): StepSkillCoverage {
  const stepId = requireId(input.stepId, "STEP_SKILL_EMPTY_STEP_ID", "stepId must be non-empty")
  assertSkillMatchesOrganization(input.skill, input.trustedOrganizationId)
  return {
    stepId,
    skillId: input.skill.id,
  }
}
