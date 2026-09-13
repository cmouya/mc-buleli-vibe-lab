import { describe, expect, it } from "vitest"
import {
  DomainError,
  createMembership,
  createOrganization,
  createPasswordCredential,
  createUser,
} from "../../../src/modules/identity/index.js"

const NOW = "2026-09-13T00:00:00.000Z"

describe("identity domain", () => {
  it("creates an organization with trimmed name", () => {
    const org = createOrganization({ name: "  Acme  ", id: "o1" }, { now: NOW })
    expect(org).toEqual({ id: "o1", name: "Acme", createdAt: NOW })
  })

  it("rejects empty organization name", () => {
    expect(() => createOrganization({ name: "  " })).toThrow(DomainError)
  })

  it("normalizes password identifier and keeps User free of email", () => {
    const user = createUser({ id: "u1" }, { now: NOW })
    expect(user).toEqual({ id: "u1", createdAt: NOW })
    const cred = createPasswordCredential(
      { userId: "u1", identifier: "  Ada@Org.Example  ", secretHash: "opaque" },
      { now: NOW },
    )
    expect(cred.identifier).toBe("ada@org.example")
    expect(cred.type).toBe("password")
  })

  it("rejects learner as a membership role", () => {
    expect(() =>
      createMembership({
        organizationId: "o1",
        userId: "u1",
        role: "learner",
      }),
    ).toThrow(DomainError)
  })

  it("creates org_admin and member memberships", () => {
    const admin = createMembership(
      { organizationId: "o1", userId: "u1", role: "org_admin", id: "m1" },
      { now: NOW },
    )
    expect(admin.role).toBe("org_admin")
    const member = createMembership({ organizationId: "o2", userId: "u1", role: "member" })
    expect(member.role).toBe("member")
    expect(member.organizationId).toBe("o2")
  })
})
