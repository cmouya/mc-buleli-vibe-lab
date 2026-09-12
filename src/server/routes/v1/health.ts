import type { FastifyInstance } from "fastify"

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/api/v1/health",
    {
      schema: {
        tags: ["health"],
        summary: "Liveness check",
      },
    },
    async () => ({ status: "ok" }),
  )
}
