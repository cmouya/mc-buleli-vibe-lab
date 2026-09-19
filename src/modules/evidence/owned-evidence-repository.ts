import type { Evidence } from "../../shared/types/domain.types.js"
import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"

export type { GoalOwnerScope }

/**
 * Tenant-safe Evidence writes. Ownership is proved through Step → Path → Goal,
 * never via independent organization_id/learner_id on Evidence.
 */
export interface OwnedEvidenceRepository {
  saveOwned(evidence: Evidence, scope: GoalOwnerScope, goalId: string): Promise<Evidence>
}
