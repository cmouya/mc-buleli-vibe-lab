import type { FastifyInstance } from "fastify"
import {
  login,
  logout,
  resolveSession,
  type LoginDependencies,
} from "../../../application/index.js"
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  authCookieOptions,
} from "../../auth-cookie.js"

const loginBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["identifier", "password"],
  properties: {
    identifier: { type: "string" },
    password: { type: "string" },
  },
} as const

export async function registerAuthRoutes(
  app: FastifyInstance,
  deps: LoginDependencies,
): Promise<void> {
  const cookie = authCookieOptions()

  app.post(
    "/api/v1/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
      schema: {
        tags: ["auth"],
        summary: "Create a server session",
        body: loginBodySchema,
      },
    },
    async (request, reply) => {
      const body = request.body as { identifier: string; password: string }
      const result = await login(
        { identifier: body.identifier, password: body.password },
        deps,
      )
      reply.setCookie(AUTH_COOKIE_NAME, result.sessionCookieToken, {
        ...cookie,
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
      })
      return {
        userId: result.context.userId,
        memberships: result.context.memberships,
      }
    },
  )

  app.post(
    "/api/v1/auth/logout",
    {
      schema: {
        tags: ["auth"],
        summary: "Revoke the current session",
      },
    },
    async (request, reply) => {
      await logout(request.cookies[AUTH_COOKIE_NAME], deps)
      reply.clearCookie(AUTH_COOKIE_NAME, cookie)
      return reply.status(204).send()
    },
  )

  app.get(
    "/api/v1/auth/session",
    {
      schema: {
        tags: ["auth"],
        summary: "Resolve the current session",
      },
    },
    async (request) => {
      const context = await resolveSession(request.cookies[AUTH_COOKIE_NAME], deps)
      return {
        userId: context.userId,
        memberships: context.memberships,
        expiresAt: context.expiresAt,
      }
    },
  )
}
