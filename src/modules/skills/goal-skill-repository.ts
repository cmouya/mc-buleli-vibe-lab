import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"
import type { GoalSkillRequirement } from "./goal-skill-requirement.js"

export type { GoalOwnerScope }

/** Owned Goal ↔ Skill persistence. goalId/skillId are not tenant authority. */
export interface GoalSkillRepository {
  bindOwned(
    goalId: string,
    skillId: string,
    scope: GoalOwnerScope,
  ): Promise<GoalSkillRequirement>
}
