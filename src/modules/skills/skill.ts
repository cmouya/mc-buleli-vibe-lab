/**
 * Skill domain — generic capability, independent of any learner.
 * Skill ≠ LearnerSkill. Skill ≠ Goal.
 */

import type { Skill } from "../../shared/types/domain.types.js"
import { DomainError } from "../shared/domain-error.js"

export type { Skill }

export interface CreateSkillInput {
  id: string
  name: string
  description?: string
  domain?: string
  prerequisiteIds?: string[]
}

/**
 * Create a Skill in the registry. Requires id + non-empty name.
 */
export function createSkill(input: CreateSkillInput): Skill {
  const id = input.id.trim()
  const name = input.name.trim()

  if (!id) {
    throw new DomainError("SKILL_EMPTY_ID", "Skill id must be non-empty")
  }
  if (!name) {
    throw new DomainError("SKILL_EMPTY_NAME", "Skill name must be non-empty")
  }

  const skill: Skill = { id, name }

  if (input.description !== undefined) {
    skill.description = input.description
  }
  if (input.domain !== undefined) {
    skill.domain = input.domain
  }
  if (input.prerequisiteIds !== undefined) {
    skill.prerequisiteIds = [...input.prerequisiteIds]
  }

  return skill
}

/**
 * Type guard: Skill has id+name and no masteryLevel / statement.
 */
export function isSkill(value: unknown): value is Skill {
  if (value === null || typeof value !== "object") {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    !("masteryLevel" in record) &&
    !("statement" in record) &&
    !("status" in record)
  )
}
