import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"
import type { AcceptedLearningPath } from "./accepted-path.js"

export type { GoalOwnerScope }

/**
 * Tenant-safe Path writes. Ownership is proved through the Goal,
 * never via independent organization_id/learner_id on Path or Step.
 */
export interface OwnedLearningPathRepository {
  saveOwned(path: AcceptedLearningPath, scope: GoalOwnerScope): Promise<AcceptedLearningPath>
}
