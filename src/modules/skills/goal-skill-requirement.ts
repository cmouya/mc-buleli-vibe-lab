/**
 * Goal → Skill requirement (desired outcome). Many-to-many.
 * Goal references Skills; Goal does not own Skills.
 * ADR-021: requiredLevel is mandatory in the domain (not persisted as NULL).
 */

import type { MasteryLevel } from "../../shared/types/domain.types.js"
import { DomainError } from "../shared/domain-error.js"
import {
  assertSkillMatchesOrganization,
  type OrganizationSkill,
} from "./organization-skill.js"

export type RequiredProficiency = Exclude<MasteryLevel, "none">

export const REQUIRED_PROFICIENCY_LEVELS: readonly RequiredProficiency[] = [
  "emerging",
  "proficient",
  "expert",
] as const

export function isRequiredProficiency(value: unknown): value is RequiredProficiency {
  return (
    typeof value === "string" &&
    (REQUIRED_PROFICIENCY_LEVELS as readonly string[]).includes(value)
  )
}

export function assertRequiredProficiency(value: unknown): RequiredProficiency {
  if (!isRequiredProficiency(value)) {
    throw new DomainError(
      "GOAL_SKILL_INVALID_REQUIRED_LEVEL",
      "requiredLevel must be emerging, proficient, or expert",
    )
  }
  return value
}

export interface GoalSkillRequirement {
  goalId: string
  skillId: string
  requiredLevel: RequiredProficiency
}

export interface CreateGoalSkillRequirementInput {
  goalId: string
  skillId: string
  requiredLevel: unknown
}

export interface BindGoalSkillRequirementInput {
  goalId: string
  skill: OrganizationSkill
  /** Trusted Goal organization (from Goal ownership / LearnerContext). Not taken from Path/Step. */
  goalOrganizationId: string
  requiredLevel: unknown
}

function requireId(value: string, code: string, message: string): string {
  const id = value.trim()
  if (!id) {
    throw new DomainError(code, message)
  }
  return id
}

/** Requirement triple. Tenant check belongs on bindGoalSkillRequirement. */
export function createGoalSkillRequirement(
  input: CreateGoalSkillRequirementInput,
): GoalSkillRequirement {
  return {
    goalId: requireId(input.goalId, "GOAL_SKILL_EMPTY_GOAL_ID", "goalId must be non-empty"),
    skillId: requireId(input.skillId, "GOAL_SKILL_EMPTY_SKILL_ID", "skillId must be non-empty"),
    requiredLevel: assertRequiredProficiency(input.requiredLevel),
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
    requiredLevel: assertRequiredProficiency(input.requiredLevel),
  }
}
