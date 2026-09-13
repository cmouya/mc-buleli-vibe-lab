import type {
  IdentityUser,
  Organization,
  OrganizationMembership,
  UserCredential,
} from "./identity.js"

export interface OrganizationRepository {
  save(organization: Organization): Promise<Organization>
  getById(id: string): Promise<Organization | null>
}

export interface UserRepository {
  save(user: IdentityUser): Promise<IdentityUser>
  getById(id: string): Promise<IdentityUser | null>
}

export interface UserCredentialRepository {
  save(credential: UserCredential): Promise<UserCredential>
  getById(id: string): Promise<UserCredential | null>
  getByTypeAndIdentifier(type: string, identifier: string): Promise<UserCredential | null>
}

export interface OrganizationMembershipRepository {
  save(membership: OrganizationMembership): Promise<OrganizationMembership>
  getById(id: string): Promise<OrganizationMembership | null>
  listByUserId(userId: string): Promise<OrganizationMembership[]>
}
