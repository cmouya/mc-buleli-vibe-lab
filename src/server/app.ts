import Fastify from "fastify"
import cookie from "@fastify/cookie"
import rateLimit from "@fastify/rate-limit"
import swagger from "@fastify/swagger"
import { getPathGenerator } from "../adapters/ai/path-generator.js"
import type { LoginDependencies, PathGenerator } from "../application/index.js"
import { mapErrorToHttp } from "./errors.js"
import { registerAuthRoutes } from "./routes/v1/auth.js"
import { registerHealthRoutes } from "./routes/v1/health.js"
import { registerGoalRoutes } from "./routes/v1/goals.js"
import { registerPathRoutes } from "./routes/v1/paths.js"

export interface BuildAppOptions {
  pathGenerator?: PathGenerator
  /**
   * Always required. Auth routes are always registered.
   * Tests inject in-memory ports. A future process entry wires Drizzle + hasher
   * outside this file (server must not import Drizzle).
   */
  auth: LoginDependencies
}

export async function buildApp(opts: BuildAppOptions) {
  if (!opts.auth) {
    throw new Error("buildApp requires auth dependencies; auth routes are always registered")
  }
  const app = Fastify({ logger: false })
  app.setErrorHandler(mapErrorToHttp)

  await app.register(cookie)
  await app.register(rateLimit, {
    global: false,
    max: 10,
    timeWindow: "1 minute",
  })
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: { title: "Learnova API", version: "0.1.0" },
    },
  })

  const pathGenerator = opts.pathGenerator ?? getPathGenerator()

  await registerHealthRoutes(app)
  await registerGoalRoutes(app)
  await registerPathRoutes(app, pathGenerator)
  await registerAuthRoutes(app, opts.auth)

  app.get(
    "/api/v1/openapi.json",
    { schema: { hide: true } },
    async () => app.swagger(),
  )

  return app
}
