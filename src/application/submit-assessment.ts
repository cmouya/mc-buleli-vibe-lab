/**
 * Submit Assessment use case — record Evidence, then authorize completion via I-05.
 * Does not mutate steps or persist state; does not reimplement Evidence-before-Completion.
 */

import {
  applyQuizAttempt,
  assertCanCompleteStep,
  type QuizAttemptInput,
  type QuizAttemptPatch,
} from "../adapters/store/index.js"
import type { DomainClockOptions } from "../modules/shared/index.js"

export function submitAssessment(
  input: QuizAttemptInput,
  opts?: DomainClockOptions,
): QuizAttemptPatch {
  const result = applyQuizAttempt(input, opts)

  if (result.completionAllowed) {
    assertCanCompleteStep(result.evidence, input.stepId)
  }

  return result
}
