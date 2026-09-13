import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { createSession } from "../../src/modules/auth/index.js"
import { createUser } from "../../src/modules/identity/index.js"
import {
  createDb,
  createDrizzleSessionRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-13T12:00:00.000Z"

describe("M5.2 — Session repository (PostgreSQL)", () => {
  it("saves and reads by token_hash without storing a raw token", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const users = createDrizzleUserRepository(db)
      const sessions = createDrizzleSessionRepository(db)
      const user = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const tokenHash = `hash-${randomUUID()}`
      const saved = await sessions.save(
        createSession(
          {
            id: randomUUID(),
            userId: user.id as string,
            tokenHash,
            expiresAt: "2026-09-14T12:00:00.000Z",
          },
          { now: NOW },
        ),
      )
      expect(saved.tokenHash).toBe(tokenHash)
      expect(JSON.stringify(saved)).not.toMatch(/rawToken/)
      const loaded = await sessions.getByTokenHash(tokenHash)
      expect(loaded?.id).toBe(saved.id)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects duplicate token_hash and missing user FK", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const users = createDrizzleUserRepository(db)
      const sessions = createDrizzleSessionRepository(db)
      const user = await users.save(createUser({ id: randomUUID() }))
      const tokenHash = `dup-${randomUUID()}`
      await sessions.save(
        createSession({
          id: randomUUID(),
          userId: user.id as string,
          tokenHash,
          expiresAt: "2026-09-14T12:00:00.000Z",
        }),
      )
      await expect(
        sessions.save(
          createSession({
            id: randomUUID(),
            userId: user.id as string,
            tokenHash,
            expiresAt: "2026-09-14T12:00:00.000Z",
          }),
        ),
      ).rejects.toThrow()
      await expect(
        sessions.save(
          createSession({
            id: randomUUID(),
            userId: randomUUID(),
            tokenHash: `fk-${randomUUID()}`,
            expiresAt: "2026-09-14T12:00:00.000Z",
          }),
        ),
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("revokes by token hash", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const users = createDrizzleUserRepository(db)
      const sessions = createDrizzleSessionRepository(db)
      const user = await users.save(createUser({ id: randomUUID() }))
      const tokenHash = `rev-${randomUUID()}`
      await sessions.save(
        createSession({
          id: randomUUID(),
          userId: user.id as string,
          tokenHash,
          expiresAt: "2026-09-14T12:00:00.000Z",
        }),
      )
      await sessions.revokeByTokenHash(tokenHash, NOW)
      const loaded = await sessions.getByTokenHash(tokenHash)
      expect(loaded?.revokedAt).toBeTruthy()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
