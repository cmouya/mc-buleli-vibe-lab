/**
 * Store ↔ Evidence domain adapter.
 * Records quiz attempts; completion is allowed only when evidence.passed (I-05).
 * Does not own UI or localStorage.
 */

import {
  assertEvidenceAllowsCompletion,
  recordQuizEvidence,
  type DomainClockOptions,
  type Evidence,
} from "../../modules/evidence/index.js"

export interface QuizAttemptInput {
  stepId: string
  score: number
  total: number
  passed: boolean
  details: Array<{
    index: number
    selected: number
    correct: boolean
  }>
  id?: string
  learnerId?: string
  assessmentId?: string
}

export interface QuizAttemptPatch {
  evidence: Evidence
  completionAllowed: boolean
}

/**
 * Map a quiz evaluation to Evidence. Failed attempts are recorded; they do not allow completion.
 */
export function applyQuizAttempt(
  input: QuizAttemptInput,
  opts?: DomainClockOptions,
): QuizAttemptPatch {
  const evidence = recordQuizEvidence(
    {
      stepId: input.stepId,
      score: input.score,
      maxScore: input.total,
      passed: input.passed,
      answers: input.details.map((item) => ({
        questionIndex: item.index,
        selectedIndex: item.selected,
        correct: item.correct,
      })),
      id: input.id,
      learnerId: input.learnerId,
      assessmentId: input.assessmentId,
    },
    opts,
  )

  return {
    evidence,
    completionAllowed: evidence.passed,
  }
}

/**
 * I-05 assert only — must not record or mutate path.
 */
export function assertCanCompleteStep(evidence: Evidence, stepId: string): void {
  assertEvidenceAllowsCompletion(evidence, stepId)
}
