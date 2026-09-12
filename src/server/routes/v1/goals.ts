import type { FastifyInstance } from "fastify"
import { confirmGoal } from "../../../application/index.js"

const confirmBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["goal", "level", "hoursPerWeek", "intent", "analyzed"],
  properties: {
    goal: { type: "string", minLength: 1 },
    level: { type: "string", enum: ["debutant", "intermediaire", "avance"] },
    hoursPerWeek: { type: "number", exclusiveMinimum: 0 },
    intent: { type: "string", enum: ["professionnel", "personnel", "academique"] },
    analyzed: { type: "boolean" },
  },
} as const

export async function registerGoalRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/v1/goals/confirm",
    {
      schema: {
        tags: ["goals"],
        summary: "Confirm an analyzed learning goal",
        body: confirmBodySchema,
      },
    },
    async (request) => {
      const body = request.body as {
        goal: string
        level: string
        hoursPerWeek: number
        intent: string
        analyzed: boolean
      }
      const patch = confirmGoal({ ...body, confirmed: false })
      return {
        confirmed: Boolean(patch.confirmed),
        analyzed: Boolean(patch.analyzed),
      }
    },
  )
}
