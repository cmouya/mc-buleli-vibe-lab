/**
 * Learner — organization-scoped learning person (ADR-016 Model C).
 * Distinct from User, OrganizationMembership, LearnerState, and role "learner".
 */

import { DomainError, resolveNow, type DomainClockOptions } from "../shared/domain-error.js"

export { DomainError }
export type { DomainClockOptions }

export interface Learner {
  id?: string
  organizationId: string
  userId: string
  createdAt: string
}

export interface CreateLearnerInput {
  organizationId: string
  userId: string
  id?: string
}

function requireNonEmpty(value: string, code: string, message: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new DomainError(code, message)
  }
  return normalized
}

export function createLearner(input: CreateLearnerInput, opts?: DomainClockOptions): Learner {
  const learner: Learner = {
    organizationId: requireNonEmpty(
      input.organizationId,
      "LEARNER_EMPTY_ORGANIZATION_ID",
      "organizationId must be non-empty",
    ),
    userId: requireNonEmpty(input.userId, "LEARNER_EMPTY_USER_ID", "userId must be non-empty"),
    createdAt: resolveNow(opts),
  }
  if (input.id !== undefined) {
    learner.id = input.id
  }
  return learner
}
