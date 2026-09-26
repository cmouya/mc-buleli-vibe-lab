import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"
import type { StepSkillCoverage } from "./step-skill-coverage.js"

export type { GoalOwnerScope }

/** Owned Step ↔ Skill persistence. stepId/skillId are not tenant authority. */
export interface StepSkillRepository {
  bindOwned(
    stepId: string,
    skillId: string,
    scope: GoalOwnerScope,
  ): Promise<StepSkillCoverage>
}
