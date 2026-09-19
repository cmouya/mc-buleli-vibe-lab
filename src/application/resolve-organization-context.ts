import { DomainError } from "../modules/shared/index.js"
import type { AuthContext } from "./resolve-session.js"

export interface OrganizationContext {
  userId: string
  organizationId: string
  role: string
}

const FORBIDDEN = new DomainError("ORG_FORBIDDEN", "Organization access denied")

/**
 * Request-scoped org authorization. Client organizationId is a request, never authority.
 * Does not load organizations — missing org and missing membership share ORG_FORBIDDEN.
 */
export function resolveOrganizationContext(
  auth: AuthContext,
  organizationId: string | undefined,
): OrganizationContext {
  const requested = organizationId?.trim() ?? ""
  const membership = requested
    ? auth.memberships.find((item) => item.organizationId === requested)
    : undefined
  if (!membership) {
    throw FORBIDDEN
  }
  return {
    userId: auth.userId,
    organizationId: membership.organizationId,
    role: membership.role,
  }
}
