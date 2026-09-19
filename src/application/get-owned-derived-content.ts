/**
 * Read Path/Step/Evidence owned through a trusted LearnerContext and Goal chain.
 * Client organizationId/learnerId never override context.
 */

import type { Evidence } from "../shared/types/domain.types.js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  OwnedDerivedContentRepository,
} from "../modules/learning-path/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { OwnedDerivedContentRepository }

function scopeOf(context: LearnerContext) {
  return {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
}

export async function getOwnedPath(
  goalId: string,
  context: LearnerContext,
  repository: OwnedDerivedContentRepository,
): Promise<AcceptedLearningPath | null> {
  return repository.getOwnedPathByGoalId(goalId, scopeOf(context))
}

export async function getOwnedStep(
  stepId: string,
  goalId: string,
  context: LearnerContext,
  repository: OwnedDerivedContentRepository,
): Promise<AcceptedPathStep | null> {
  return repository.getOwnedStepById(stepId, goalId, scopeOf(context))
}

export async function getOwnedEvidence(
  evidenceId: string,
  goalId: string,
  context: LearnerContext,
  repository: OwnedDerivedContentRepository,
): Promise<Evidence | null> {
  return repository.getOwnedEvidenceById(evidenceId, goalId, scopeOf(context))
}
