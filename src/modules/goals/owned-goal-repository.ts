import type { Goal } from "../../shared/types/domain.types.js"

/** Trusted tenant+learner scope for owned Goal operations. Not client authority. */
export interface GoalOwnerScope {
  organizationId: string
  learnerId: string
}

export interface OwnedGoalRepository {
  saveOwned(goal: Goal, scope: GoalOwnerScope): Promise<Goal>
  getOwnedById(goalId: string, scope: GoalOwnerScope): Promise<Goal | null>
}
