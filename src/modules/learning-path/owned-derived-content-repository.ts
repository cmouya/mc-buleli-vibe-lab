import type { Evidence } from "../../shared/types/domain.types.js"
import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"
import type { AcceptedLearningPath, AcceptedPathStep } from "./accepted-path.js"

export type { GoalOwnerScope }

/**
 * Tenant-safe Path/Step/Evidence reads. Ownership is proved through the Goal,
 * never via independent organization_id/learner_id on descendants.
 */
export interface OwnedDerivedContentRepository {
  getOwnedPathByGoalId(
    goalId: string,
    scope: GoalOwnerScope,
  ): Promise<AcceptedLearningPath | null>
  getOwnedStepById(
    stepId: string,
    goalId: string,
    scope: GoalOwnerScope,
  ): Promise<AcceptedPathStep | null>
  getOwnedEvidenceById(
    evidenceId: string,
    goalId: string,
    scope: GoalOwnerScope,
  ): Promise<Evidence | null>
}
