/**
 * SkillGap — derived domain concept (not persisted).
 * Progress ≠ Mastery: gap is computed from level ordinals only, never from path %.
 */

import type { LearnerSkill, MasteryLevel, SkillGap } from "../../shared/types/domain.types.js"
import { DomainError } from "../shared/domain-error.js"
import { MASTERY_LEVELS, isMasteryLevel } from "./learner-skill.js"

export type { SkillGap }

export interface CalculateSkillGapInput {
  skillId: string
  requiredLevel: MasteryLevel
  currentLevel: MasteryLevel
}

function levelIndex(level: MasteryLevel): number {
  return MASTERY_LEVELS.indexOf(level)
}

function assertLevel(level: MasteryLevel, field: string): void {
  if (!isMasteryLevel(level)) {
    throw new DomainError("SKILL_GAP_INVALID_LEVEL", `Invalid ${field}: ${level}`)
  }
}

/**
 * Deterministic SkillGap from required vs current mastery levels.
 * gapSize = max(0, requiredIndex - currentIndex); closed when current >= required.
 */
export function calculateSkillGap(input: CalculateSkillGapInput): SkillGap {
  const skillId = input.skillId.trim()
  if (!skillId) {
    throw new DomainError("SKILL_GAP_EMPTY_SKILL_ID", "skillId must be non-empty")
  }

  assertLevel(input.requiredLevel, "requiredLevel")
  assertLevel(input.currentLevel, "currentLevel")

  const requiredIndex = levelIndex(input.requiredLevel)
  const currentIndex = levelIndex(input.currentLevel)
  const gapSize = Math.max(0, requiredIndex - currentIndex)

  return {
    skillId,
    requiredLevel: input.requiredLevel,
    currentLevel: input.currentLevel,
    gapSize,
    isClosed: gapSize === 0,
  }
}

/**
 * Convenience: gap from required level + LearnerSkill current state.
 */
export function calculateSkillGapFromLearnerSkill(
  requiredLevel: MasteryLevel,
  learnerSkill: LearnerSkill,
): SkillGap {
  return calculateSkillGap({
    skillId: learnerSkill.skillId,
    requiredLevel,
    currentLevel: learnerSkill.masteryLevel,
  })
}
