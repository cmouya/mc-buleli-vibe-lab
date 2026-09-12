import Fastify from "fastify"
import swagger from "@fastify/swagger"
import { mapErrorToHttp } from "./errors.js"
import { registerHealthRoutes } from "./routes/v1/health.js"
import { registerGoalRoutes } from "./routes/v1/goals.js"

export async function buildApp() {
  const app = Fastify({ logger: false })
  app.setErrorHandler(mapErrorToHttp)

  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: { title: "Learnova API", version: "0.1.0" },
    },
  })

  await registerHealthRoutes(app)
  await registerGoalRoutes(app)

  app.get(
    "/api/v1/openapi.json",
    { schema: { hide: true } },
    async () => app.swagger(),
  )

  return app
}
