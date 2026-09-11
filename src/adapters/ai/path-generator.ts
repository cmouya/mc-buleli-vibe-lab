/**
 * PathGenerator adapter — wraps MockAIService.generatePath only.
 * Does not mutate store; Application depends on the port, not the AI class.
 */

import { getAIService } from "../../ai/index.js"
import type { PathGenerator, PathGeneratorInput } from "../../application/generate-learning-path.js"

export function asPathGenerator(service: {
  generatePath(input: PathGeneratorInput): Promise<{
    pathId: string
    pathTitle: string
    steps: unknown[]
    summary?: string
  }>
}): PathGenerator {
  return {
    generatePath(input) {
      return service.generatePath(input)
    },
  }
}

export function getPathGenerator(): PathGenerator {
  return asPathGenerator(getAIService())
}
