import { DomainError } from "../modules/shared/index.js"
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"

function isFastifyValidationError(error: FastifyError): boolean {
  return error.validation !== undefined || error.code === "FST_ERR_VALIDATION"
}

export function mapErrorToHttp(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  void request
  if (error instanceof DomainError) {
    if (error.code === "GOAL_NOT_ANALYZED") {
      return reply.status(409).send({ code: error.code, message: error.message })
    }
    if (error.code === "AUTH_INVALID_CREDENTIALS" || error.code === "AUTH_UNAUTHENTICATED") {
      return reply.status(401).send({ code: error.code, message: error.message })
    }
    if (error.code === "ORG_FORBIDDEN") {
      return reply.status(403).send({ code: error.code, message: error.message })
    }
    if (error.code === "GOAL_NOT_FOUND" || error.code === "RESOURCE_NOT_FOUND") {
      return reply.status(404).send({ code: error.code, message: error.message })
    }
    return reply.status(400).send({ code: error.code, message: error.message })
  }

  if (typeof error === "object" && error !== null && isFastifyValidationError(error as FastifyError)) {
    const fastifyError = error as FastifyError
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      message: fastifyError.message,
    })
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: number }).statusCode === 429
  ) {
    return reply.status(429).send({
      code: "RATE_LIMITED",
      message: "Too many requests",
    })
  }

  return reply.status(500).send({
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  })
}
