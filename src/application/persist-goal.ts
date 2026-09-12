import {
  confirmGoal,
  createGoal,
  markGoalAnalyzed,
  type CreateGoalInput,
  type Goal,
  type GoalRepository,
} from "../modules/goals/index.js"
import { DomainError, type DomainClockOptions } from "../modules/shared/index.js"

export type { GoalRepository }

export interface ConfirmAndPersistGoalInput extends CreateGoalInput {
  analyzed: boolean
}

/**
 * Assign a stable id if missing, then save via the injected GoalRepository.
 * Does not reimplement I-01 or analyzed-before-confirm.
 */
export async function persistGoal(
  goal: Goal,
  repository: GoalRepository,
): Promise<Goal> {
  const withId: Goal = goal.id ? goal : { ...goal, id: globalThis.crypto.randomUUID() }
  return repository.save(withId)
}

/**
 * Confirm an analyzed Goal using domain transitions, then persist.
 * Analyzed-before-confirm stays here; I-01 stays on path bind.
 */
export async function confirmAndPersistGoal(
  input: ConfirmAndPersistGoalInput,
  repository: GoalRepository,
  opts?: DomainClockOptions,
): Promise<Goal> {
  if (!input.analyzed) {
    throw new DomainError(
      "GOAL_NOT_ANALYZED",
      "Goal must be analyzed before confirmation",
    )
  }

  const created = createGoal({
    statement: input.statement,
    level: input.level,
    hoursPerWeek: input.hoursPerWeek,
    intent: input.intent,
    id: input.id ?? globalThis.crypto.randomUUID(),
  })
  const analyzed = markGoalAnalyzed(created, opts)
  const confirmed = confirmGoal(analyzed, opts)
  return persistGoal(confirmed, repository)
}
