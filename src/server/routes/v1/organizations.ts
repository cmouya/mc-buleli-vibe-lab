import type { FastifyInstance } from "fastify"
import {
  resolveOrganizationContext,
  resolveSession,
  type LoginDependencies,
} from "../../../application/index.js"
import { AUTH_COOKIE_NAME } from "../../auth-cookie.js"

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  deps: LoginDependencies,
): Promise<void> {
  app.get(
    "/api/v1/organizations/:organizationId/context",
    {
      schema: {
        tags: ["organizations"],
        summary: "Resolve membership-validated organization context",
        params: {
          type: "object",
          additionalProperties: false,
          required: ["organizationId"],
          properties: {
            organizationId: { type: "string" },
          },
        },
      },
    },
    async (request) => {
      const auth = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      const { organizationId } = request.params as { organizationId: string }
      const context = resolveOrganizationContext(auth, organizationId)
      return {
        userId: context.userId,
        organizationId: context.organizationId,
        role: context.role,
      }
    },
  )
}
