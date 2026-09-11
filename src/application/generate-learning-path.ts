/**
 * Generate Learning Path use case.
 * Invokes an injected PathGenerator; does not persist, delay, or reimplement I-01.
 */

export interface PathGeneratorInput {
  goal: string
  level: string
  hoursPerWeek: number
  intent?: string
}

export interface GeneratedPath {
  pathId: string
  pathTitle: string
  steps: unknown[]
  summary?: string
}

export interface PathGenerator {
  generatePath(input: PathGeneratorInput): Promise<GeneratedPath>
}

export async function generateLearningPath(
  input: PathGeneratorInput,
  pathGenerator: PathGenerator,
): Promise<GeneratedPath> {
  return pathGenerator.generatePath(input)
}
