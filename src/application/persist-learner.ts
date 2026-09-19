/**
 * Persist an organization-scoped Learner. Explicit/in-process only — not login or HTTP.
 */

import { createLearner, type Learner, type LearnerRepository } from "../modules/learner/index.js"
import type { DomainClockOptions } from "../modules/shared/index.js"

export type { Learner, LearnerRepository }

export interface PersistLearnerInput {
  organizationId: string
  userId: string
  id?: string
}

function withId(learner: Learner): Learner {
  if (learner.id) {
    return learner
  }
  return { ...learner, id: globalThis.crypto.randomUUID() }
}

export async function persistLearner(
  input: PersistLearnerInput,
  repository: LearnerRepository,
  opts?: DomainClockOptions,
): Promise<Learner> {
  return repository.save(withId(createLearner(input, opts)))
}
