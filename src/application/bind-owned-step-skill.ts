/**
 * Bind an owned Path Step to an organization-scoped Skill.
 * LearnerContext is tenant authority. Client organizationId/learnerId are not.
 */

import type { GoalOwnerScope } from "../modules/goals/index.js"
import type { StepSkillCoverage, StepSkillRepository } from "../modules/skills/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { StepSkillCoverage, StepSkillRepository }

export interface BindOwnedStepSkillInput {
  stepId: string
  skillId: string
  organizationId?: string
  learnerId?: string
}

export async function bindOwnedStepSkill(
  input: BindOwnedStepSkillInput,
  context: LearnerContext,
  repository: StepSkillRepository,
): Promise<StepSkillCoverage> {
  const scope: GoalOwnerScope = {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
  return repository.bindOwned(input.stepId, input.skillId, scope)
}
