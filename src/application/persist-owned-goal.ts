/**
 * Persist and read Goals owned by a trusted LearnerContext.
 * Client organizationId/learnerId never override context.
 */

import {
  createGoal,
  type CreateGoalInput,
  type Goal,
  type OwnedGoalRepository,
} from "../modules/goals/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"

export type { OwnedGoalRepository }

export interface PersistOwnedGoalInput extends CreateGoalInput {
  organizationId?: string
  learnerId?: string
}

function withId(goal: Goal): Goal {
  if (goal.id) {
    return goal
  }
  return { ...goal, id: globalThis.crypto.randomUUID() }
}

export async function persistOwnedGoal(
  input: PersistOwnedGoalInput,
  context: LearnerContext,
  repository: OwnedGoalRepository,
): Promise<Goal> {
  const created = withId(
    createGoal({
      statement: input.statement,
      level: input.level,
      hoursPerWeek: input.hoursPerWeek,
      intent: input.intent,
      id: input.id,
    }),
  )
  const owned: Goal = {
    ...created,
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
  return repository.saveOwned(owned, context)
}

export async function getOwnedGoal(
  goalId: string,
  context: LearnerContext,
  repository: OwnedGoalRepository,
): Promise<Goal | null> {
  return repository.getOwnedById(goalId, context)
}
