/**
 * LearnerSkill — learner's state relative to a Skill (≠ Skill).
 * No mastery algorithm: level is set explicitly; evidence ids are refs only.
 */

import type { LearnerSkill, MasteryLevel } from "../../shared/types/domain.types.js"
import { DomainError, type DomainClockOptions } from "../shared/domain-error.js"

export type { LearnerSkill, MasteryLevel }

export const MASTERY_LEVELS: readonly MasteryLevel[] = [
  "none",
  "emerging",
  "proficient",
  "expert",
] as const

export function isMasteryLevel(value: string): value is MasteryLevel {
  return (MASTERY_LEVELS as readonly string[]).includes(value)
}

export interface CreateLearnerSkillInput {
  skillId: string
  learnerId?: string
}

/**
 * Create a LearnerSkill at masteryLevel "none" with empty evidence.
 */
export function createLearnerSkill(input: CreateLearnerSkillInput): LearnerSkill {
  const skillId = input.skillId.trim()
  if (!skillId) {
    throw new DomainError("LEARNER_SKILL_EMPTY_SKILL_ID", "skillId must be non-empty")
  }

  const learnerSkill: LearnerSkill = {
    skillId,
    masteryLevel: "none",
    evidenceIds: [],
  }

  if (input.learnerId !== undefined) {
    learnerSkill.learnerId = input.learnerId
  }

  return learnerSkill
}

/**
 * Explicitly set mastery level. Does not compute mastery from evidence.
 */
export function setLearnerSkillLevel(
  learnerSkill: LearnerSkill,
  level: MasteryLevel,
  opts?: DomainClockOptions,
): LearnerSkill {
  if (!isMasteryLevel(level)) {
    throw new DomainError("LEARNER_SKILL_INVALID_LEVEL", `Invalid mastery level: ${level}`)
  }

  const updated: LearnerSkill = {
    ...learnerSkill,
    masteryLevel: level,
    evidenceIds: [...learnerSkill.evidenceIds],
  }

  if (opts?.now !== undefined) {
    updated.lastAssessedAt = opts.now
  }

  return updated
}

/**
 * Append a unique evidence id reference. Does not change masteryLevel.
 */
export function addLearnerSkillEvidenceRef(
  learnerSkill: LearnerSkill,
  evidenceId: string,
): LearnerSkill {
  const id = evidenceId.trim()
  if (!id) {
    throw new DomainError("LEARNER_SKILL_EMPTY_EVIDENCE_ID", "evidenceId must be non-empty")
  }

  if (learnerSkill.evidenceIds.includes(id)) {
    return {
      ...learnerSkill,
      evidenceIds: [...learnerSkill.evidenceIds],
    }
  }

  return {
    ...learnerSkill,
    evidenceIds: [...learnerSkill.evidenceIds, id],
  }
}
