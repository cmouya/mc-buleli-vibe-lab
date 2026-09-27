import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"
import type { EvidenceSkillAttribution } from "./evidence-skill-attribution.js"

export type { GoalOwnerScope }

/** Owned Evidence ↔ Skill persistence. evidenceId/skillId are not tenant authority. */
export interface EvidenceSkillRepository {
  bindOwned(
    evidenceId: string,
    skillId: string,
    scope: GoalOwnerScope,
  ): Promise<EvidenceSkillAttribution>
}
