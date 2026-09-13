export {
  DomainError,
  SESSION_TTL_MS,
  createSession,
  expiresAtFrom,
  isSessionActive,
  revokeSession,
} from "./session.js"

export type { AuthSession, CreateSessionInput, DomainClockOptions } from "./session.js"

export type {
  PasswordHasher,
  SessionRepository,
  SessionTokenIssuer,
  TokenDigest,
} from "./ports.js"
