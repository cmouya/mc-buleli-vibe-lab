/**
 * Bind owned Evidence to an organization-scoped Skill that the Evidence Step covers.
 * LearnerContext is tenant authority. Client organizationId/learnerId are not.
 * Does not auto-expand to every Skill covered by the Step.
 */

import type { GoalOwnerScope } from "../modules/goals/index.js"
import {
  createEvidenceSkillAttribution,
  type EvidenceSkillAttribution,
  type EvidenceSkillRepository,
} from "../modules/skills/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { EvidenceSkillAttribution, EvidenceSkillRepository }

export interface BindOwnedEvidenceSkillInput {
  evidenceId: string
  skillId: string
  organizationId?: string
  learnerId?: string
}

export async function bindOwnedEvidenceSkill(
  input: BindOwnedEvidenceSkillInput,
  context: LearnerContext,
  repository: EvidenceSkillRepository,
): Promise<EvidenceSkillAttribution> {
  const pair = createEvidenceSkillAttribution({
    evidenceId: input.evidenceId,
    skillId: input.skillId,
  })
  const scope: GoalOwnerScope = {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
  return repository.bindOwned(pair.evidenceId, pair.skillId, scope)
}
