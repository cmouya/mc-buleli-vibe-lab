import {
  recordQuizEvidence,
  scoreOwnedQuiz,
  type Evidence,
  type OwnedEvidenceRepository,
  type OwnedStepQuizRepository,
  type QuizSelection,
} from "../modules/evidence/index.js"
import type { OwnedDerivedContentRepository } from "../modules/learning-path/index.js"
import { DomainError, type DomainClockOptions } from "../modules/shared/index.js"
import { getOwnedStep } from "./get-owned-derived-content.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { OwnedStepQuizRepository }

export interface SubmitOwnedQuizAttemptInput {
  goalId: string
  stepId: string
  selections: readonly QuizSelection[]
}

/** Owned key + pure scorer + trusted write; no completion or Skill state writes. */
export async function submitOwnedQuizAttempt(
  input: SubmitOwnedQuizAttemptInput,
  context: LearnerContext,
  derived: OwnedDerivedContentRepository,
  quizzes: OwnedStepQuizRepository,
  evidence: OwnedEvidenceRepository,
  opts?: DomainClockOptions,
): Promise<Evidence> {
  const scope = { organizationId: context.organizationId, learnerId: context.learnerId }
  const step = await getOwnedStep(input.stepId, input.goalId, context, derived)
  if (!step?.id) {
    throw new DomainError("RESOURCE_NOT_FOUND", "Not found")
  }
  const quiz = await quizzes.getOwned(step.id, input.goalId, scope)
  if (!quiz) {
    throw new DomainError("QUIZ_DEFINITION_REQUIRED", "This Step has no trusted quiz")
  }
  const result = scoreOwnedQuiz(quiz, input.selections)
  const recorded = recordQuizEvidence({
    id: globalThis.crypto.randomUUID(),
    stepId: step.id,
    score: result.score,
    maxScore: result.maxScore,
    passed: result.passed,
    answers: [...result.answers],
  }, opts)
  return evidence.saveOwnedServerRecalculated(recorded, scope, input.goalId)
}
