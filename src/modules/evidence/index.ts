export {
  DomainError,
  recordQuizEvidence,
  assertEvidenceAllowsCompletion,
} from "./evidence.js"

export type {
  Evidence,
  EvidenceAnswer,
  RecordQuizEvidenceInput,
  DomainClockOptions,
} from "./evidence.js"
export type { EvidenceRepository } from "./evidence-repository.js"
export type { OwnedEvidenceRepository, GoalOwnerScope } from "./owned-evidence-repository.js"
