/**
 * Persist identity island. No HTTP auth routes or learning-spine ownership.
 * secretHash is opaque — M5.1 does not hash or verify passwords.
 */

import {
  createMembership,
  createOrganization,
  createPasswordCredential,
  createUser,
  type MembershipRole,
  type OrganizationMembershipRepository,
  type OrganizationRepository,
  type UserCredentialRepository,
  type UserRepository,
} from "../modules/identity/index.js"
import type { DomainClockOptions } from "../modules/shared/index.js"

export type {
  OrganizationMembershipRepository,
  OrganizationRepository,
  UserCredentialRepository,
  UserRepository,
}

function withId<T extends { id?: string }>(item: T): T {
  if (item.id) {
    return item
  }
  return { ...item, id: globalThis.crypto.randomUUID() }
}

export async function persistOrganization(
  name: string,
  repository: OrganizationRepository,
  opts?: DomainClockOptions,
) {
  return repository.save(withId(createOrganization({ name }, opts)))
}

export async function persistUser(repository: UserRepository, opts?: DomainClockOptions) {
  return repository.save(withId(createUser({}, opts)))
}

export async function persistPasswordCredential(
  input: { userId: string; identifier: string; secretHash: string },
  repository: UserCredentialRepository,
  opts?: DomainClockOptions,
) {
  return repository.save(withId(createPasswordCredential(input, opts)))
}

export async function persistMembership(
  input: { organizationId: string; userId: string; role: MembershipRole },
  repository: OrganizationMembershipRepository,
  opts?: DomainClockOptions,
) {
  return repository.save(withId(createMembership(input, opts)))
}

export interface IdentityRepositories {
  organizations: OrganizationRepository
  users: UserRepository
  credentials: UserCredentialRepository
  memberships: OrganizationMembershipRepository
}

export interface BootstrapTestIdentityInput {
  organizationName: string
  email: string
  secretHash: string
  role: MembershipRole
}

/**
 * In-process bootstrap for architecture/persistence tests. Not public registration.
 */
export async function bootstrapTestIdentity(
  input: BootstrapTestIdentityInput,
  repos: IdentityRepositories,
  opts?: DomainClockOptions,
) {
  const organization = await persistOrganization(input.organizationName, repos.organizations, opts)
  const user = await persistUser(repos.users, opts)
  const credential = await persistPasswordCredential(
    {
      userId: user.id as string,
      identifier: input.email,
      secretHash: input.secretHash,
    },
    repos.credentials,
    opts,
  )
  const membership = await persistMembership(
    {
      organizationId: organization.id as string,
      userId: user.id as string,
      role: input.role,
    },
    repos.memberships,
    opts,
  )
  return { organization, user, credential, membership }
}
