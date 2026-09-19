/**
 * Request-scoped Learner resolution. OrganizationContext is the tenant authority.
 * Client learnerId is never accepted. Does not create Learners.
 */

import { DomainError } from "../modules/shared/index.js"
import type { LearnerRepository } from "../modules/learner/index.js"
import type { OrganizationContext } from "./resolve-organization-context.js"

export interface LearnerContext {
  learnerId: string
  userId: string
  organizationId: string
}

const FORBIDDEN = new DomainError("ORG_FORBIDDEN", "Organization access denied")

export async function resolveLearnerContext(
  organization: OrganizationContext,
  repository: LearnerRepository,
): Promise<LearnerContext> {
  const learner = await repository.getByOrganizationAndUserId(
    organization.organizationId,
    organization.userId,
  )
  if (
    !learner?.id ||
    learner.organizationId !== organization.organizationId ||
    learner.userId !== organization.userId
  ) {
    throw FORBIDDEN
  }
  return {
    learnerId: learner.id,
    userId: organization.userId,
    organizationId: organization.organizationId,
  }
}
