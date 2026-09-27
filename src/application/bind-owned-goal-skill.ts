/**
 * Bind an owned Goal to an organization-scoped Skill at a required proficiency.
 * LearnerContext is tenant authority. Client organizationId/learnerId are not.
 */

import type { GoalOwnerScope } from "../modules/goals/index.js"
import {
  assertRequiredProficiency,
  type GoalSkillRepository,
  type GoalSkillRequirement,
} from "../modules/skills/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { GoalSkillRepository, GoalSkillRequirement }

export interface BindOwnedGoalSkillInput {
  goalId: string
  skillId: string
  requiredLevel: unknown
  organizationId?: string
  learnerId?: string
}

export async function bindOwnedGoalSkill(
  input: BindOwnedGoalSkillInput,
  context: LearnerContext,
  repository: GoalSkillRepository,
): Promise<GoalSkillRequirement> {
  const requiredLevel = assertRequiredProficiency(input.requiredLevel)
  const scope: GoalOwnerScope = {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
  return repository.bindOwned(input.goalId, input.skillId, requiredLevel, scope)
}
