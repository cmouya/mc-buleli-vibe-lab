import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type {
  IdentityUser,
  Organization,
  OrganizationMembership,
  OrganizationMembershipRepository,
  OrganizationRepository,
  UserCredential,
  UserCredentialRepository,
  UserRepository,
} from "../../modules/identity/index.js"
import { isCredentialType, isMembershipRole } from "../../modules/identity/index.js"
import {
  organizationMemberships,
  organizations,
  userCredentials,
  users,
} from "./schema.js"
import * as schema from "./schema.js"

function toIso(value: string | null): string {
  if (!value) {
    return new Date().toISOString()
  }
  const ms = Date.parse(value)
  if (Number.isNaN(ms)) {
    return value
  }
  return new Date(ms).toISOString()
}

function requireId(id: string | undefined, label: string): string {
  if (!id) {
    throw new Error(`${label}.id is required before save`)
  }
  return id
}

export function createDrizzleOrganizationRepository(
  db: PostgresJsDatabase<typeof schema>,
): OrganizationRepository {
  return {
    async save(item: Organization): Promise<Organization> {
      const id = requireId(item.id, "Organization")
      await db.insert(organizations).values({
        id,
        name: item.name,
        createdAt: item.createdAt,
      })
      const saved = await db.select().from(organizations).where(eq(organizations.id, id))
      if (!saved[0]) {
        throw new Error("Organization save did not persist")
      }
      return { id: saved[0].id, name: saved[0].name, createdAt: toIso(saved[0].createdAt) }
    },
    async getById(id: string): Promise<Organization | null> {
      const rows = await db.select().from(organizations).where(eq(organizations.id, id))
      return rows[0]
        ? { id: rows[0].id, name: rows[0].name, createdAt: toIso(rows[0].createdAt) }
        : null
    },
  }
}

export function createDrizzleUserRepository(
  db: PostgresJsDatabase<typeof schema>,
): UserRepository {
  return {
    async save(item: IdentityUser): Promise<IdentityUser> {
      const id = requireId(item.id, "User")
      await db.insert(users).values({ id, createdAt: item.createdAt })
      const saved = await db.select().from(users).where(eq(users.id, id))
      if (!saved[0]) {
        throw new Error("User save did not persist")
      }
      return { id: saved[0].id, createdAt: toIso(saved[0].createdAt) }
    },
    async getById(id: string): Promise<IdentityUser | null> {
      const rows = await db.select().from(users).where(eq(users.id, id))
      return rows[0] ? { id: rows[0].id, createdAt: toIso(rows[0].createdAt) } : null
    },
  }
}

export function createDrizzleUserCredentialRepository(
  db: PostgresJsDatabase<typeof schema>,
): UserCredentialRepository {
  return {
    async save(item: UserCredential): Promise<UserCredential> {
      const id = requireId(item.id, "UserCredential")
      await db.insert(userCredentials).values({
        id,
        userId: item.userId,
        type: item.type,
        identifier: item.identifier,
        secretHash: item.secretHash,
        createdAt: item.createdAt,
      })
      const saved = await db.select().from(userCredentials).where(eq(userCredentials.id, id))
      if (!saved[0]) {
        throw new Error("UserCredential save did not persist")
      }
      return toCredential(saved[0])
    },
    async getById(id: string): Promise<UserCredential | null> {
      const rows = await db.select().from(userCredentials).where(eq(userCredentials.id, id))
      return rows[0] ? toCredential(rows[0]) : null
    },
    async getByTypeAndIdentifier(type: string, identifier: string): Promise<UserCredential | null> {
      const rows = await db
        .select()
        .from(userCredentials)
        .where(and(eq(userCredentials.type, type), eq(userCredentials.identifier, identifier)))
      return rows[0] ? toCredential(rows[0]) : null
    },
  }
}

function toCredential(row: typeof userCredentials.$inferSelect): UserCredential {
  if (!isCredentialType(row.type)) {
    throw new Error(`invalid persisted credential type: ${row.type}`)
  }
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    identifier: row.identifier,
    secretHash: row.secretHash,
    createdAt: toIso(row.createdAt),
  }
}

export function createDrizzleOrganizationMembershipRepository(
  db: PostgresJsDatabase<typeof schema>,
): OrganizationMembershipRepository {
  return {
    async save(item: OrganizationMembership): Promise<OrganizationMembership> {
      const id = requireId(item.id, "OrganizationMembership")
      await db.insert(organizationMemberships).values({
        id,
        organizationId: item.organizationId,
        userId: item.userId,
        role: item.role,
        createdAt: item.createdAt,
      })
      const saved = await db
        .select()
        .from(organizationMemberships)
        .where(eq(organizationMemberships.id, id))
      if (!saved[0]) {
        throw new Error("OrganizationMembership save did not persist")
      }
      return toMembership(saved[0])
    },
    async getById(id: string): Promise<OrganizationMembership | null> {
      const rows = await db
        .select()
        .from(organizationMemberships)
        .where(eq(organizationMemberships.id, id))
      return rows[0] ? toMembership(rows[0]) : null
    },
    async listByUserId(userId: string): Promise<OrganizationMembership[]> {
      const rows = await db
        .select()
        .from(organizationMemberships)
        .where(eq(organizationMemberships.userId, userId))
      return rows.map(toMembership)
    },
  }
}

function toMembership(row: typeof organizationMemberships.$inferSelect): OrganizationMembership {
  if (!isMembershipRole(row.role)) {
    throw new Error(`invalid persisted membership role: ${row.role}`)
  }
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    role: row.role,
    createdAt: toIso(row.createdAt),
  }
}
