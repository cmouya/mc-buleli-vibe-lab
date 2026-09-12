import { assertGoalReadyForPath } from "../modules/goals/index.js"
import type { GoalRepository } from "../modules/goals/index.js"
import { DomainError } from "../modules/shared/index.js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  LearningPathRepository,
} from "../modules/learning-path/index.js"
import type { GeneratedPath } from "./generate-learning-path.js"

export type { LearningPathRepository }

export interface AcceptLearningPathInput {
  goalId: string
  proposal: GeneratedPath
}

function newId(): string {
  return globalThis.crypto.randomUUID()
}

function normalizeSteps(rawSteps: unknown[]): AcceptedPathStep[] {
  return rawSteps.map((item, index) => {
    if (item === null || typeof item !== "object") {
      throw new DomainError("PATH_STEP_INVALID", "Path steps must be objects")
    }
    const record = item as Record<string, unknown>
    const title = typeof record.title === "string" ? record.title.trim() : ""
    if (!title) {
      throw new DomainError("PATH_STEP_EMPTY_TITLE", "Path step title must be non-empty")
    }
    const step: AcceptedPathStep = {
      id: newId(),
      position: index,
      title,
      description: typeof record.description === "string" ? record.description : "",
    }
    if (typeof record.id === "string" && record.id.trim()) {
      step.sourceStepId = record.id.trim()
    }
    return step
  })
}

/**
 * Accept a generated path proposal against a persisted confirmed Goal (I-01).
 * Does not persist generate-only proposals; does not reimplement assertGoalReadyForPath.
 */
export async function acceptLearningPath(
  input: AcceptLearningPathInput,
  goalRepository: GoalRepository,
  pathRepository: LearningPathRepository,
): Promise<AcceptedLearningPath> {
  const goal = await goalRepository.getById(input.goalId)
  if (!goal) {
    throw new DomainError("GOAL_NOT_FOUND", "Goal not found")
  }
  assertGoalReadyForPath(goal)

  const steps = normalizeSteps(input.proposal.steps)
  const path: AcceptedLearningPath = {
    id: newId(),
    goalId: input.goalId,
    title: input.proposal.pathTitle.trim(),
    steps,
  }
  if (input.proposal.summary !== undefined) {
    path.summary = input.proposal.summary
  }
  if (input.proposal.pathId.trim()) {
    path.sourcePathId = input.proposal.pathId.trim()
  }
  if (!path.title) {
    throw new DomainError("PATH_EMPTY_TITLE", "Accepted path title must be non-empty")
  }

  return pathRepository.save(path)
}
