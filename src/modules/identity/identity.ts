/**
 * Identity domain — User ≠ Learner. No HTTP auth. No learning-spine ownership.
 */

import { DomainError, resolveNow, type DomainClockOptions } from "../shared/domain-error.js"

export { DomainError }
export type { DomainClockOptions }

export type MembershipRole = "org_admin" | "member"
export type CredentialType = "password"

const ROLES: readonly MembershipRole[] = ["org_admin", "member"]
const CREDENTIAL_TYPES: readonly CredentialType[] = ["password"]

export interface Organization {
  id?: string
  name: string
  createdAt: string
}

export interface IdentityUser {
  id?: string
  createdAt: string
}

export interface UserCredential {
  id?: string
  userId: string
  type: CredentialType
  identifier: string
  secretHash: string
  createdAt: string
}

export interface OrganizationMembership {
  id?: string
  organizationId: string
  userId: string
  role: MembershipRole
  createdAt: string
}

export interface CreateOrganizationInput {
  name: string
  id?: string
}

export interface CreateUserInput {
  id?: string
}

export interface CreatePasswordCredentialInput {
  userId: string
  identifier: string
  secretHash: string
  id?: string
}

export interface CreateMembershipInput {
  organizationId: string
  userId: string
  role: string
  id?: string
}

function requireNonEmpty(value: string, code: string, message: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new DomainError(code, message)
  }
  return normalized
}

export function createOrganization(
  input: CreateOrganizationInput,
  opts?: DomainClockOptions,
): Organization {
  const org: Organization = {
    name: requireNonEmpty(input.name, "ORG_EMPTY_NAME", "organization name must be non-empty"),
    createdAt: resolveNow(opts),
  }
  if (input.id !== undefined) {
    org.id = input.id
  }
  return org
}

export function createUser(input?: CreateUserInput, opts?: DomainClockOptions): IdentityUser {
  const user: IdentityUser = { createdAt: resolveNow(opts) }
  if (input?.id !== undefined) {
    user.id = input.id
  }
  return user
}

export function createPasswordCredential(
  input: CreatePasswordCredentialInput,
  opts?: DomainClockOptions,
): UserCredential {
  const userId = requireNonEmpty(input.userId, "CREDENTIAL_EMPTY_USER_ID", "userId must be non-empty")
  const identifier = requireNonEmpty(
    input.identifier,
    "CREDENTIAL_EMPTY_IDENTIFIER",
    "identifier must be non-empty",
  ).toLowerCase()
  const secretHash = requireNonEmpty(
    input.secretHash,
    "CREDENTIAL_EMPTY_SECRET_HASH",
    "secretHash must be non-empty",
  )
  const credential: UserCredential = {
    userId,
    type: "password",
    identifier,
    secretHash,
    createdAt: resolveNow(opts),
  }
  if (input.id !== undefined) {
    credential.id = input.id
  }
  return credential
}

export function createMembership(
  input: CreateMembershipInput,
  opts?: DomainClockOptions,
): OrganizationMembership {
  const organizationId = requireNonEmpty(
    input.organizationId,
    "MEMBERSHIP_EMPTY_ORG_ID",
    "organizationId must be non-empty",
  )
  const userId = requireNonEmpty(input.userId, "MEMBERSHIP_EMPTY_USER_ID", "userId must be non-empty")
  if (!isMembershipRole(input.role)) {
    throw new DomainError("MEMBERSHIP_INVALID_ROLE", "role must be org_admin or member")
  }
  const membership: OrganizationMembership = {
    organizationId,
    userId,
    role: input.role,
    createdAt: resolveNow(opts),
  }
  if (input.id !== undefined) {
    membership.id = input.id
  }
  return membership
}

export function isMembershipRole(value: string): value is MembershipRole {
  return (ROLES as readonly string[]).includes(value)
}

export function isCredentialType(value: string): value is CredentialType {
  return (CREDENTIAL_TYPES as readonly string[]).includes(value)
}
