import type { FastifyInstance } from "fastify"
import {
  generateLearningPath,
  type PathGenerator,
  type PathGeneratorInput,
} from "../../../application/index.js"

const generateBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["goal", "level", "hoursPerWeek", "intent"],
  properties: {
    goal: { type: "string", minLength: 1 },
    level: { type: "string", enum: ["debutant", "intermediaire", "avance"] },
    hoursPerWeek: { type: "number", exclusiveMinimum: 0 },
    intent: { type: "string", enum: ["professionnel", "personnel", "academique"] },
  },
} as const

const generateResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["pathId", "pathTitle", "steps"],
  properties: {
    pathId: { type: "string" },
    pathTitle: { type: "string" },
    summary: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
        required: ["id", "title"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
        },
      },
    },
  },
} as const

export async function registerPathRoutes(
  app: FastifyInstance,
  pathGenerator: PathGenerator,
): Promise<void> {
  app.post(
    "/api/v1/paths/generate",
    {
      schema: {
        tags: ["paths"],
        summary:
          "Return an AI-assisted learning path proposal. Does not persist, bind a path, or apply Goal-before-Path (I-01).",
        body: generateBodySchema,
        response: {
          200: generateResponseSchema,
        },
      },
    },
    async (request) => {
      const body = request.body as PathGeneratorInput
      return generateLearningPath(body, pathGenerator)
    },
  )
}
