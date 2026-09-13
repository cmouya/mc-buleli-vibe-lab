import type { AuthSession } from "./session.js"

export interface SessionRepository {
  save(session: AuthSession): Promise<AuthSession>
  getByTokenHash(tokenHash: string): Promise<AuthSession | null>
  revokeByTokenHash(tokenHash: string, revokedAt: string): Promise<void>
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(secretHash: string, password: string): Promise<boolean>
  dummyHash(): string
  needsRehash(secretHash: string): boolean
}

export interface TokenDigest {
  digest(rawToken: string): string
}

export interface SessionTokenIssuer {
  issue(): string
}
