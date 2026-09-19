/**
 * Persist already-scored Evidence under an authorized Step of an owned Goal.
 * Client organizationId/learnerId/goalId/stepId/type/id/recordedAt never override
 * LearnerContext or server-controlled fields.
 * Does not authorize via global identifier lookup. Does not mutate progress or mastery.
 */

import { recordQuizEvidence, type EvidenceAnswer } from "../modules/evidence/index.js"
import type { Evidence, OwnedEvidenceRepository } from "../modules/evidence/index.js"
import { DomainError, type DomainClockOptions } from "../modules/shared/index.js"
import type { OwnedDerivedContentRepository } from "../modules/learning-path/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"
import { getOwnedStep } from "./get-owned-derived-content.js"

export type { OwnedEvidenceRepository }

export interface PersistOwnedEvidenceInput {
  goalId: string
  stepId: string
  score: number
  maxScore: number
  passed: boolean
  answers: EvidenceAnswer[]
}

const NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

function withId(evidence: Evidence): Evidence {
  if (evidence.id) {
    return evidence
  }
  return { ...evidence, id: globalThis.crypto.randomUUID() }
}

function scopeOf(context: LearnerContext) {
  return {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
}

export async function persistOwnedEvidence(
  input: PersistOwnedEvidenceInput,
  context: LearnerContext,
  derived: OwnedDerivedContentRepository,
  evidence: OwnedEvidenceRepository,
  opts?: DomainClockOptions,
): Promise<Evidence> {
  const scope = scopeOf(context)
  const step = await getOwnedStep(input.stepId, input.goalId, context, derived)
  if (!step?.id) {
    throw NOT_FOUND
  }

  const recorded = recordQuizEvidence(
    {
      stepId: step.id,
      score: input.score,
      maxScore: input.maxScore,
      passed: input.passed,
      answers: input.answers,
    },
    opts,
  )

  return evidence.saveOwned(withId(recorded), scope, input.goalId)
}
