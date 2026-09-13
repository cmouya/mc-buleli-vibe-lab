import { eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import type { AuthSession, SessionRepository } from "../../modules/auth/index.js"
import { sessions } from "./schema.js"
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

function toSession(row: typeof sessions.$inferSelect): AuthSession {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt: toIso(row.expiresAt),
    revokedAt: row.revokedAt ? toIso(row.revokedAt) : null,
    createdAt: toIso(row.createdAt),
  }
}

export function createDrizzleSessionRepository(
  db: PostgresJsDatabase<typeof schema>,
): SessionRepository {
  return {
    async save(item: AuthSession): Promise<AuthSession> {
      const id = requireId(item.id, "AuthSession")
      await db.insert(sessions).values({
        id,
        userId: item.userId,
        tokenHash: item.tokenHash,
        expiresAt: item.expiresAt,
        revokedAt: item.revokedAt,
        createdAt: item.createdAt,
      })
      const saved = await db.select().from(sessions).where(eq(sessions.id, id))
      if (!saved[0]) {
        throw new Error("Session save did not persist")
      }
      return toSession(saved[0])
    },
    async getByTokenHash(tokenHash: string): Promise<AuthSession | null> {
      const rows = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash))
      return rows[0] ? toSession(rows[0]) : null
    },
    async revokeByTokenHash(tokenHash: string, revokedAt: string): Promise<void> {
      await db
        .update(sessions)
        .set({ revokedAt })
        .where(eq(sessions.tokenHash, tokenHash))
    },
  }
}
