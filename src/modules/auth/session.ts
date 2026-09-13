/**
 * Auth session domain - User only. No organization_id. No Learner.
 */

import { DomainError, resolveNow, type DomainClockOptions } from "../shared/domain-error.js"

export { DomainError }
export type { DomainClockOptions }

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000

export interface AuthSession {
  id?: string
  userId: string
  tokenHash: string
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}

export interface CreateSessionInput {
  userId: string
  tokenHash: string
  expiresAt: string
  id?: string
}

function requireNonEmpty(value: string, code: string, message: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new DomainError(code, message)
  }
  return normalized
}

export function createSession(input: CreateSessionInput, opts?: DomainClockOptions): AuthSession {
  const session: AuthSession = {
    userId: requireNonEmpty(input.userId, "SESSION_EMPTY_USER_ID", "userId must be non-empty"),
    tokenHash: requireNonEmpty(
      input.tokenHash,
      "SESSION_EMPTY_TOKEN_HASH",
      "tokenHash must be non-empty",
    ),
    expiresAt: requireNonEmpty(
      input.expiresAt,
      "SESSION_EMPTY_EXPIRES_AT",
      "expiresAt must be non-empty",
    ),
    revokedAt: null,
    createdAt: resolveNow(opts),
  }
  if (input.id !== undefined) {
    session.id = input.id
  }
  return session
}

export function isSessionActive(session: AuthSession, now: string): boolean {
  if (session.revokedAt) {
    return false
  }
  const expiresMs = Date.parse(session.expiresAt)
  const nowMs = Date.parse(now)
  if (Number.isNaN(expiresMs) || Number.isNaN(nowMs)) {
    return false
  }
  return expiresMs > nowMs
}

export function revokeSession(session: AuthSession, opts?: DomainClockOptions): AuthSession {
  if (session.revokedAt) {
    return session
  }
  return { ...session, revokedAt: resolveNow(opts) }
}

export function expiresAtFrom(now: string, ttlMs: number = SESSION_TTL_MS): string {
  const ms = Date.parse(now)
  if (Number.isNaN(ms)) {
    throw new DomainError("SESSION_INVALID_NOW", "now must be an ISO timestamp")
  }
  return new Date(ms + ttlMs).toISOString()
}
