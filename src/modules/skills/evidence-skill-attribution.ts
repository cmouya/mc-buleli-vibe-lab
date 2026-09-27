/**
 * ADR-021 Evidence↔Skill attribution. Many-to-many identity pair only.
 * Attribution is explicit. It is not Step coverage and not Mastery.
 */

import { DomainError } from "../shared/domain-error.js"

export interface EvidenceSkillAttribution {
  evidenceId: string
  skillId: string
}

export interface CreateEvidenceSkillAttributionInput {
  evidenceId: string
  skillId: string
}

function requireId(value: string, code: string, message: string): string {
  const id = value.trim()
  if (!id) {
    throw new DomainError(code, message)
  }
  return id
}

export function createEvidenceSkillAttribution(
  input: CreateEvidenceSkillAttributionInput,
): EvidenceSkillAttribution {
  return {
    evidenceId: requireId(
      input.evidenceId,
      "EVIDENCE_SKILL_EMPTY_EVIDENCE_ID",
      "evidenceId must be non-empty",
    ),
    skillId: requireId(input.skillId, "EVIDENCE_SKILL_EMPTY_SKILL_ID", "skillId must be non-empty"),
  }
}
