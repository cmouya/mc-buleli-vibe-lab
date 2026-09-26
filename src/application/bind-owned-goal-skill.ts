/**
 * Bind an owned Goal to an organization-scoped Skill.
 * LearnerContext is tenant authority. Client organizationId/learnerId are not.
 */

import type { GoalOwnerScope } from "../modules/goals/index.js"
import type { GoalSkillRepository, GoalSkillRequirement } from "../modules/skills/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { GoalSkillRepository, GoalSkillRequirement }

export interface BindOwnedGoalSkillInput {
  goalId: string
  skillId: string
  organizationId?: string
  learnerId?: string
}

export async function bindOwnedGoalSkill(
  input: BindOwnedGoalSkillInput,
  context: LearnerContext,
  repository: GoalSkillRepository,
): Promise<GoalSkillRequirement> {
  const scope: GoalOwnerScope = {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
  return repository.bindOwned(input.goalId, input.skillId, scope)
}
