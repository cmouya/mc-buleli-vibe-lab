import { describe, expect, it } from "vitest"
import { resolveOrganizationContext } from "../../../src/application/resolve-organization-context.js"
import type { AuthContext } from "../../../src/application/resolve-session.js"
import { DomainError } from "../../../src/modules/shared/index.js"

function auth(overrides?: Partial<AuthContext>): AuthContext {
  return {
    sessionId: "sess-1",
    userId: "user-a",
    memberships: [{ organizationId: "org-a", role: "member" }],
    expiresAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  }
}

describe("application — resolveOrganizationContext", () => {
  it("resolves OrganizationContext from memberships, not from organizationId alone", () => {
    const context = resolveOrganizationContext(auth(), "org-a")
    expect(context).toEqual({
      userId: "user-a",
      organizationId: "org-a",
      role: "member",
    })
    expect(context).not.toHaveProperty("sessionCookieToken")
    expect(context).not.toHaveProperty("rawToken")
  })

  it("denies a requested organization that is not in memberships", () => {
    expect(() => resolveOrganizationContext(auth(), "org-b")).toThrow(DomainError)
    try {
      resolveOrganizationContext(auth(), "org-b")
    } catch (error) {
      expect(error).toMatchObject({ code: "ORG_FORBIDDEN" })
    }
  })

  it("allows each organization for a multi-org user", () => {
    const multi = auth({
      memberships: [
        { organizationId: "org-a", role: "member" },
        { organizationId: "org-b", role: "org_admin" },
      ],
    })
    expect(resolveOrganizationContext(multi, "org-a").role).toBe("member")
    expect(resolveOrganizationContext(multi, "org-b").role).toBe("org_admin")
  })

  it("denies zero memberships, empty id, and unknown id with the same error", () => {
    const empty = auth({ memberships: [] })
    const codes = ["org-a", "", "   ", undefined].map((requested) => {
      try {
        resolveOrganizationContext(empty, requested)
        return "ok"
      } catch (error) {
        return (error as DomainError).code
      }
    })
    expect(codes).toEqual(["ORG_FORBIDDEN", "ORG_FORBIDDEN", "ORG_FORBIDDEN", "ORG_FORBIDDEN"])
  })
})
