/**
 * ADR-020 Goal → Skill requirement (desired outcome). Many-to-many.
 * Goal references Skills; Goal does not own Skills. No target proficiency.
 */

import { DomainError } from "../shared/domain-error.js"
import {
  assertSkillMatchesOrganization,
  type OrganizationSkill,
} from "./organization-skill.js"

export interface GoalSkillRequirement {
  goalId: string
  skillId: string
}

export interface CreateGoalSkillRequirementInput {
  goalId: string
  skillId: string
}

export interface BindGoalSkillRequirementInput {
  goalId: string
  skill: OrganizationSkill
  /** Trusted Goal organization (from Goal ownership / LearnerContext). Not taken from Path/Step. */
  goalOrganizationId: string
}

function requireId(value: string, code: string, message: string): string {
  const id = value.trim()
  if (!id) {
    throw new DomainError(code, message)
  }
  return id
}

/** Requirement pair only. Tenant check belongs on bindGoalSkillRequirement. */
export function createGoalSkillRequirement(
  input: CreateGoalSkillRequirementInput,
): GoalSkillRequirement {
  return {
    goalId: requireId(input.goalId, "GOAL_SKILL_EMPTY_GOAL_ID", "goalId must be non-empty"),
    skillId: requireId(input.skillId, "GOAL_SKILL_EMPTY_SKILL_ID", "skillId must be non-empty"),
  }
}

/**
 * Bind a Goal requirement to an organization-scoped Skill under trusted Goal organization.
 */
export function bindGoalSkillRequirement(input: BindGoalSkillRequirementInput): GoalSkillRequirement {
  const goalId = requireId(input.goalId, "GOAL_SKILL_EMPTY_GOAL_ID", "goalId must be non-empty")
  assertSkillMatchesOrganization(input.skill, input.goalOrganizationId)
  return {
    goalId,
    skillId: input.skill.id,
  }
}
