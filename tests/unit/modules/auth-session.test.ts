import { describe, expect, it } from "vitest"
import {
  createSession,
  expiresAtFrom,
  isSessionActive,
  revokeSession,
} from "../../../src/modules/auth/index.js"

const NOW = "2026-09-13T12:00:00.000Z"
const LATER = "2026-09-13T13:00:00.000Z"

describe("auth session domain", () => {
  it("treats unrevoked unexpired sessions as active", () => {
    const session = createSession(
      {
        userId: "u1",
        tokenHash: "abc",
        expiresAt: expiresAtFrom(NOW),
      },
      { now: NOW },
    )
    expect(isSessionActive(session, NOW)).toBe(true)
    expect(isSessionActive(session, expiresAtFrom(NOW))).toBe(false)
  })

  it("treats revoked sessions as inactive", () => {
    const session = createSession(
      { userId: "u1", tokenHash: "abc", expiresAt: expiresAtFrom(NOW) },
      { now: NOW },
    )
    const revoked = revokeSession(session, { now: LATER })
    expect(isSessionActive(revoked, LATER)).toBe(false)
  })
})
