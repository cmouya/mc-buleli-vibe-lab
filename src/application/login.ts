import { DomainError } from "../modules/shared/index.js"
import {
  createSession,
  expiresAtFrom,
  type PasswordHasher,
  type SessionRepository,
  type SessionTokenIssuer,
  type TokenDigest,
} from "../modules/auth/index.js"
import type {
  OrganizationMembershipRepository,
  UserCredentialRepository,
  UserRepository,
} from "../modules/identity/index.js"
import type { DomainClockOptions } from "../modules/shared/index.js"
import type { AuthContext } from "./resolve-session.js"

const INVALID = new DomainError("AUTH_INVALID_CREDENTIALS", "Invalid credentials")

export interface LoginDependencies {
  credentials: UserCredentialRepository
  users: UserRepository
  memberships: OrganizationMembershipRepository
  sessions: SessionRepository
  hasher: PasswordHasher
  tokens: SessionTokenIssuer
  digest: TokenDigest
}

export interface LoginInput {
  identifier: string
  password: string
}

/** Safe session data plus a server-only cookie secret. Never put sessionCookieToken on AuthContext. */
export interface LoginResult {
  context: AuthContext
  sessionCookieToken: string
}

function withId<T extends { id?: string }>(item: T): T {
  if (item.id) {
    return item
  }
  return { ...item, id: globalThis.crypto.randomUUID() }
}

export async function login(
  input: LoginInput,
  deps: LoginDependencies,
  opts?: DomainClockOptions,
): Promise<LoginResult> {
  const identifier = input.identifier.trim().toLowerCase()
  const password = input.password
  const credential = identifier
    ? await deps.credentials.getByTypeAndIdentifier("password", identifier)
    : null
  const hashToVerify = credential?.secretHash ?? deps.hasher.dummyHash()
  let passwordOk = false
  if (password) {
    try {
      passwordOk = await deps.hasher.verify(hashToVerify, password)
    } catch {
      passwordOk = false
    }
  }
  if (!identifier || !password || !credential || !passwordOk) {
    throw INVALID
  }
  const user = await deps.users.getById(credential.userId)
  if (!user?.id) {
    throw INVALID
  }
  const memberships = await deps.memberships.listByUserId(user.id)
  const now = opts?.now ?? new Date().toISOString()
  const sessionCookieToken = deps.tokens.issue()
  const tokenHash = deps.digest.digest(sessionCookieToken)
  const session = await deps.sessions.save(
    withId(
      createSession(
        {
          userId: user.id,
          tokenHash,
          expiresAt: expiresAtFrom(now),
        },
        { now },
      ),
    ),
  )
  return {
    context: {
      sessionId: session.id as string,
      userId: user.id,
      memberships: memberships.map((item) => ({
        organizationId: item.organizationId,
        role: item.role,
      })),
      expiresAt: session.expiresAt,
    },
    sessionCookieToken,
  }
}
