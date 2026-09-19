/**
 * Persist an accepted Path + nested Steps under an already-owned Goal.
 * Client organizationId/learnerId/goal ownership fields never override LearnerContext.
 * Does not authorize via GoalRepository.getById.
 */

import { assertGoalReadyForPath, type OwnedGoalRepository } from "../modules/goals/index.js"
import { DomainError } from "../modules/shared/index.js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  OwnedLearningPathRepository,
} from "../modules/learning-path/index.js"
import type { GeneratedPath } from "./generate-learning-path.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { OwnedLearningPathRepository }

export interface PersistOwnedPathInput {
  goalId: string
  proposal: GeneratedPath
  organizationId?: string
  learnerId?: string
}

const NOT_FOUND = new DomainError("GOAL_NOT_FOUND", "Goal not found")

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

function scopeOf(context: LearnerContext) {
  return {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
}

export async function persistOwnedPath(
  input: PersistOwnedPathInput,
  context: LearnerContext,
  goals: OwnedGoalRepository,
  paths: OwnedLearningPathRepository,
): Promise<AcceptedLearningPath> {
  const scope = scopeOf(context)
  const goal = await goals.getOwnedById(input.goalId, scope)
  if (!goal?.id) {
    throw NOT_FOUND
  }
  assertGoalReadyForPath(goal)

  const steps = normalizeSteps(input.proposal.steps)
  const path: AcceptedLearningPath = {
    id: newId(),
    goalId: goal.id,
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

  return paths.saveOwned(path, scope)
}

export { persistOwnedPath as acceptOwnedPath }
