/**
 * Evidence domain — tangible learning proof (Assessment ≠ Evidence).
 * I-05: no step completion without Evidence.passed === true.
 * Framework-independent; no localStorage.
 */

import type { Evidence, EvidenceAnswer } from "../../shared/types/domain.types.js"
import {
  DomainError,
  resolveNow,
  type DomainClockOptions,
} from "../shared/domain-error.js"

export type { Evidence, EvidenceAnswer, DomainClockOptions }
export { DomainError }

export interface RecordQuizEvidenceInput {
  stepId: string
  score: number
  maxScore: number
  passed: boolean
  answers: EvidenceAnswer[]
  id?: string
  learnerId?: string
  assessmentId?: string
}

function assertFiniteNonNegative(value: number, code: string, message: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new DomainError(code, message)
  }
}

/**
 * Record a quiz attempt as Evidence. Does not mutate path/progress.
 * Failed attempts are valid evidence (passed: false).
 */
export function recordQuizEvidence(
  input: RecordQuizEvidenceInput,
  opts?: DomainClockOptions,
): Evidence {
  const stepId = input.stepId.trim()
  if (!stepId) {
    throw new DomainError("EVIDENCE_EMPTY_STEP_ID", "stepId must be non-empty")
  }

  assertFiniteNonNegative(input.score, "EVIDENCE_INVALID_SCORE", "score must be a non-negative number")
  assertFiniteNonNegative(
    input.maxScore,
    "EVIDENCE_INVALID_MAX_SCORE",
    "maxScore must be a non-negative number",
  )

  if (input.maxScore <= 0) {
    throw new DomainError("EVIDENCE_INVALID_MAX_SCORE", "maxScore must be greater than 0")
  }
  if (input.score > input.maxScore) {
    throw new DomainError("EVIDENCE_SCORE_EXCEEDS_MAX", "score cannot exceed maxScore")
  }

  if (!Array.isArray(input.answers)) {
    throw new DomainError("EVIDENCE_INVALID_ANSWERS", "answers must be an array")
  }

  const evidence: Evidence = {
    stepId,
    type: "quiz_attempt",
    score: input.score,
    maxScore: input.maxScore,
    passed: Boolean(input.passed),
    answers: input.answers.map((item) => ({
      questionIndex: item.questionIndex,
      selectedIndex: item.selectedIndex,
      correct: Boolean(item.correct),
    })),
    recordedAt: resolveNow(opts),
  }

  if (input.id !== undefined) {
    evidence.id = input.id
  }
  if (input.learnerId !== undefined) {
    evidence.learnerId = input.learnerId
  }
  if (input.assessmentId !== undefined) {
    evidence.assessmentId = input.assessmentId
  }

  return evidence
}

/**
 * I-05 — Evidence before Completion: step may be marked done only with passed evidence for that step.
 */
export function assertEvidenceAllowsCompletion(evidence: Evidence, stepId: string): void {
  const expected = stepId.trim()
  if (!expected) {
    throw new DomainError("EVIDENCE_EMPTY_STEP_ID", "stepId must be non-empty")
  }
  if (evidence.stepId !== expected) {
    throw new DomainError(
      "EVIDENCE_STEP_MISMATCH",
      "Evidence stepId must match the step being completed",
    )
  }
  if (!evidence.passed) {
    throw new DomainError(
      "EVIDENCE_NOT_PASSED",
      "Step cannot be completed without passed evidence",
    )
  }
}
