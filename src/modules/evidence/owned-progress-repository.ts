import type { Evidence } from "../../shared/types/domain.types.js"
import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"

export type { GoalOwnerScope }

/**
 * Tenant-safe Evidence reads for derived Completion/Progress.
 * Ownership is proved through Step → Path → Goal, never via unscoped getByStepId.
 */
export interface OwnedProgressRepository {
  listOwnedEvidenceForStep(
    stepId: string,
    goalId: string,
    scope: GoalOwnerScope,
  ): Promise<Evidence[]>
}