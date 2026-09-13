import { DomainError, resolveNow, type DomainClockOptions } from "../modules/shared/index.js"
import { isSessionActive, type SessionRepository, type TokenDigest } from "../modules/auth/index.js"
import type {
  OrganizationMembershipRepository,
  UserRepository,
} from "../modules/identity/index.js"

export interface AuthContext {
  sessionId: string
  userId: string
  memberships: { organizationId: string; role: string }[]
  expiresAt: string
}

export async function resolveSession(
  rawToken: string | undefined,
  deps: {
    sessions: SessionRepository
    users: UserRepository
    memberships: OrganizationMembershipRepository
    digest: TokenDigest
  },
  opts?: DomainClockOptions,
): Promise<AuthContext> {
  const unauthenticated = new DomainError("AUTH_UNAUTHENTICATED", "Not authenticated")
  if (!rawToken?.trim()) {
    throw unauthenticated
  }
  const session = await deps.sessions.getByTokenHash(deps.digest.digest(rawToken))
  const now = resolveNow(opts)
  if (!session?.id || !isSessionActive(session, now)) {
    throw unauthenticated
  }
  const user = await deps.users.getById(session.userId)
  if (!user?.id) {
    throw unauthenticated
  }
  const memberships = await deps.memberships.listByUserId(user.id)
  return {
    sessionId: session.id,
    userId: user.id,
    memberships: memberships.map((item) => ({
      organizationId: item.organizationId,
      role: item.role,
    })),
    expiresAt: session.expiresAt,
  }
}
