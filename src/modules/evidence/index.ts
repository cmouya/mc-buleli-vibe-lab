export {
  DomainError,
  recordQuizEvidence,
  assertEvidenceAllowsCompletion,
  evidenceAllowsCompletion,
} from "./evidence.js"

export type {
  Evidence,
  EvidenceAnswer,
  ScoringProvenance,
  RecordQuizEvidenceInput,
  DomainClockOptions,
} from "./evidence.js"
export type { EvidenceRepository } from "./evidence-repository.js"
export type { OwnedEvidenceRepository, GoalOwnerScope } from "./owned-evidence-repository.js"
export type { OwnedStepQuizRepository } from "./owned-step-quiz-repository.js"
export type { OwnedProgressRepository } from "./owned-progress-repository.js"
export { assertOwnedQuizDefinition } from "./assert-owned-quiz-definition.js"
export {
  CLIENT_DECLARED_PROVENANCE,
  SERVER_RECALCULATED_PROVENANCE,
  scoringProvenanceFromPersisted,
} from "./scoring-provenance.js"
export { scoreOwnedQuiz } from "./score-owned-quiz.js"
export type {
  OwnedQuizItem,
  OwnedQuizDefinition,
  QuizSelection,
  ScoredQuizAnswer,
  ScoredQuizAttempt,
} from "./score-owned-quiz.js"
