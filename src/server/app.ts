import Fastify from "fastify"
import swagger from "@fastify/swagger"
import { getPathGenerator } from "../adapters/ai/path-generator.js"
import type { PathGenerator } from "../application/index.js"
import { mapErrorToHttp } from "./errors.js"
import { registerHealthRoutes } from "./routes/v1/health.js"
import { registerGoalRoutes } from "./routes/v1/goals.js"
import { registerPathRoutes } from "./routes/v1/paths.js"

export async function buildApp(opts?: { pathGenerator?: PathGenerator }) {
  const app = Fastify({ logger: false })
  app.setErrorHandler(mapErrorToHttp)

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: { title: "Learnova API", version: "0.1.0" },
    },
  })

  const pathGenerator = opts?.pathGenerator ?? getPathGenerator()

  await registerHealthRoutes(app)
  await registerGoalRoutes(app)
  await registerPathRoutes(app, pathGenerator)

  app.get(
    "/api/v1/openapi.json",
    { schema: { hide: true } },
    async () => app.swagger(),
  )

  return app
}
