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
    const status = error.code === "GOAL_NOT_ANALYZED" ? 409 : 400
    return reply.status(status).send({ code: error.code, message: error.message })
  }

  if (typeof error === "object" && error !== null && isFastifyValidationError(error as FastifyError)) {
    const fastifyError = error as FastifyError
    return reply.status(400).send({
      code: "VALIDATION_ERROR",
      message: fastifyError.message,
    })
  }

  return reply.status(500).send({
    code: "INTERNAL_ERROR",
    message: "Internal server error",
  })
}
