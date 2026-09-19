import Fastify from "fastify"
import cookie from "@fastify/cookie"
import rateLimit from "@fastify/rate-limit"
import swagger from "@fastify/swagger"
import { getPathGenerator } from "../adapters/ai/path-generator.js"
import type {
  LearnerRepository,
  LoginDependencies,
  OwnedDerivedContentRepository,
  OwnedGoalRepository,
  PathGenerator,
} from "../application/index.js"
import { mapErrorToHttp } from "./errors.js"
import { registerAuthRoutes } from "./routes/v1/auth.js"
import { registerHealthRoutes } from "./routes/v1/health.js"
import { registerGoalRoutes } from "./routes/v1/goals.js"
import { registerPathRoutes } from "./routes/v1/paths.js"
import { registerOrganizationRoutes } from "./routes/v1/organizations.js"

export interface BuildAppOptions {
  pathGenerator?: PathGenerator
  /**
   * Always required. Auth routes are always registered.
   * Tests inject in-memory ports. A future process entry wires Drizzle + hasher
   * outside this file (server must not import Drizzle).
   */
  auth: LoginDependencies
  /** Required for organization-scoped LearnerContext. Not used by public confirm/generate. */
  learners: LearnerRepository
  /** Required for organization-scoped owned Goal HTTP. Not used by public confirm/generate. */
  ownedGoals: OwnedGoalRepository
  /** Required for organization-scoped Path/Step/Evidence reads. Not used by public confirm/generate. */
  ownedDerived: OwnedDerivedContentRepository
}

export async function buildApp(opts: BuildAppOptions) {
  if (!opts.auth) {
    throw new Error("buildApp requires auth dependencies; auth routes are always registered")
  }
  if (!opts.learners) {
    throw new Error("buildApp requires learners; LearnerContext routes are always registered")
  }
  if (!opts.ownedGoals) {
    throw new Error("buildApp requires ownedGoals; owned Goal routes are always registered")
  }
  if (!opts.ownedDerived) {
    throw new Error("buildApp requires ownedDerived; owned Path/Step/Evidence routes are always registered")
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
  await registerOrganizationRoutes(app, {
    ...opts.auth,
    learners: opts.learners,
    ownedGoals: opts.ownedGoals,
    ownedDerived: opts.ownedDerived,
  })

  app.get(
    "/api/v1/openapi.json",
    { schema: { hide: true } },
    async () => app.swagger(),
  )

  return app
}
