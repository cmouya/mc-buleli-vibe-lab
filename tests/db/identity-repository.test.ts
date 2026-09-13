import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  createMembership,
  createOrganization,
  createPasswordCredential,
  createUser,
} from "../../src/modules/identity/index.js"
import {
  createDb,
  createDrizzleOrganizationMembershipRepository,
  createDrizzleOrganizationRepository,
  createDrizzleUserCredentialRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-13T00:00:00.000Z"

describe("M5.1 — Identity repository (PostgreSQL)", () => {
  it("saves identity island rows and two memberships for one user", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const creds = createDrizzleUserCredentialRepository(db)
      const memberships = createDrizzleOrganizationMembershipRepository(db)
      const orgA = await orgs.save(
        createOrganization({ name: "Acme", id: randomUUID() }, { now: NOW }),
      )
      const orgB = await orgs.save(
        createOrganization({ name: "Beta", id: randomUUID() }, { now: NOW }),
      )
      const user = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const credential = await creds.save(
        createPasswordCredential(
          {
            id: randomUUID(),
            userId: user.id as string,
            identifier: `ada-${randomUUID()}@acme.test`,
            secretHash: "test-hash",
          },
          { now: NOW },
        ),
      )
      expect(credential.type).toBe("password")
      await memberships.save(
        createMembership({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: user.id as string,
          role: "org_admin",
        }),
      )
      await memberships.save(
        createMembership({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: user.id as string,
          role: "member",
        }),
      )
      const listed = await memberships.listByUserId(user.id as string)
      expect(listed).toHaveLength(2)
      expect(await creds.getByTypeAndIdentifier(credential.type, credential.identifier)).toEqual(
        credential,
      )
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects duplicate membership and learner role via constraints", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const memberships = createDrizzleOrganizationMembershipRepository(db)
      const org = await orgs.save(createOrganization({ name: "Acme", id: randomUUID() }))
      const user = await users.save(createUser({ id: randomUUID() }))
      const other = await users.save(createUser({ id: randomUUID() }))
      const input = {
        id: randomUUID(),
        organizationId: org.id as string,
        userId: user.id as string,
        role: "member" as const,
      }
      await memberships.save(createMembership(input))
      await expect(
        memberships.save(createMembership({ ...input, id: randomUUID() })),
      ).rejects.toThrow()
      await expect(
        client`
          INSERT INTO organization_memberships (id, organization_id, user_id, role)
          VALUES (
            ${randomUUID()}::uuid,
            ${org.id}::uuid,
            ${other.id}::uuid,
            'learner'
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects unknown credential type and missing user FK", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      await expect(
        client`
          INSERT INTO user_credentials (id, user_id, type, identifier, secret_hash)
          VALUES (
            ${randomUUID()}::uuid,
            ${randomUUID()}::uuid,
            'password',
            ${`x-${randomUUID()}@t.test`},
            'h'
          )
        `,
      ).rejects.toThrow()
      const db = createDb(client)
      const users = createDrizzleUserRepository(db)
      const user = await users.save(createUser({ id: randomUUID() }))
      await expect(
        client`
          INSERT INTO user_credentials (id, user_id, type, identifier, secret_hash)
          VALUES (
            ${randomUUID()}::uuid,
            ${user.id}::uuid,
            'oidc',
            ${`y-${randomUUID()}@t.test`},
            'h'
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects duplicate password identifier via UNIQUE (type, identifier)", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const users = createDrizzleUserRepository(db)
      const creds = createDrizzleUserCredentialRepository(db)
      const userA = await users.save(createUser({ id: randomUUID() }))
      const userB = await users.save(createUser({ id: randomUUID() }))
      const identifier = `dup-${randomUUID()}@acme.test`
      await creds.save(
        createPasswordCredential({
          id: randomUUID(),
          userId: userA.id as string,
          identifier,
          secretHash: "test-hash",
        }),
      )
      await expect(
        creds.save(
          createPasswordCredential({
            id: randomUUID(),
            userId: userB.id as string,
            identifier,
            secretHash: "other-hash",
          }),
        ),
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
