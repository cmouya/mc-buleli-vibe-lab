/**
 * Persist Evidence from a quiz submission. Does not mutate progress/completion.
 * I-05 stays in submitAssessment and the domain; persist never gates failed INSERTs.
 * `stepId` must be the durable `learning_path_steps.id` UUID (FK-enforced).
 */

import { submitAssessment } from "./submit-assessment.js"
import type { QuizAttemptInput, QuizAttemptPatch } from "../adapters/store/index.js"
import type { Evidence, EvidenceRepository } from "../modules/evidence/index.js"
import type { DomainClockOptions } from "../modules/shared/index.js"

export type { EvidenceRepository }

function withId(evidence: Evidence): Evidence {
  if (evidence.id) {
    return evidence
  }
  return { ...evidence, id: globalThis.crypto.randomUUID() }
}

export async function persistEvidence(
  evidence: Evidence,
  repository: EvidenceRepository,
): Promise<Evidence> {
  return repository.save(withId(evidence))
}

export async function submitAndPersistEvidence(
  input: QuizAttemptInput,
  repository: EvidenceRepository,
  opts?: DomainClockOptions,
): Promise<QuizAttemptPatch> {
  const result = submitAssessment(input, opts)
  const evidence = await persistEvidence(result.evidence, repository)
  return { evidence, completionAllowed: result.completionAllowed }
}
