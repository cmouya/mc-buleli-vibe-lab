import type { SessionRepository, TokenDigest } from "../modules/auth/index.js"
import { resolveNow, type DomainClockOptions } from "../modules/shared/index.js"

export async function logout(
  rawToken: string | undefined,
  deps: { sessions: SessionRepository; digest: TokenDigest },
  opts?: DomainClockOptions,
): Promise<void> {
  if (!rawToken?.trim()) {
    return
  }
  await deps.sessions.revokeByTokenHash(deps.digest.digest(rawToken), resolveNow(opts))
}
