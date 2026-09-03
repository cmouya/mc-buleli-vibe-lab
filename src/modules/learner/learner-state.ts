/**
 * LearnerState — current learning session/path state (≠ Learner identity/profile).
 * Framework-independent; no localStorage.
 */

import {
  DomainError,
  resolveNow,
  type DomainClockOptions,
} from "../shared/domain-error.js"

/**
 * Domain LearnerState (target). Distinct from Phase 0 prototype LearnerState
 * in shared/types/learner.types.ts which documents store.js shape.
 */
export interface DomainLearnerState {
  learnerId?: string
  activeGoalId?: string
  pathId?: string
  pathTitle?: string
  currentStepId?: string
  updatedAt: string | null
}

export interface CreateLearnerStateInput {
  learnerId?: string
  activeGoalId?: string
}

export interface BindPathInput {
  pathId: string
  pathTitle?: string
  currentStepId?: string
}

function withUpdatedAt(
  state: DomainLearnerState,
  opts?: DomainClockOptions,
): DomainLearnerState {
  return {
    ...state,
    updatedAt: resolveNow(opts),
  }
}

/**
 * Create an empty learning-session snapshot (not a user profile).
 */
export function createLearnerState(input: CreateLearnerStateInput = {}): DomainLearnerState {
  const state: DomainLearnerState = {
    updatedAt: null,
  }

  if (input.learnerId !== undefined) {
    state.learnerId = input.learnerId
  }
  if (input.activeGoalId !== undefined) {
    state.activeGoalId = input.activeGoalId
  }

  return state
}

/**
 * Bind an active goal and clear path fields (goal change resets path).
 */
export function bindActiveGoal(
  state: DomainLearnerState,
  goalId: string,
  opts?: DomainClockOptions,
): DomainLearnerState {
  const id = goalId.trim()
  if (!id) {
    throw new DomainError("LEARNER_STATE_EMPTY_GOAL_ID", "goalId must be non-empty")
  }

  return withUpdatedAt(
    {
      ...state,
      activeGoalId: id,
      pathId: undefined,
      pathTitle: undefined,
      currentStepId: undefined,
    },
    opts,
  )
}

/**
 * Attach path references only (no step arrays / progress %).
 */
export function bindPath(
  state: DomainLearnerState,
  input: BindPathInput,
  opts?: DomainClockOptions,
): DomainLearnerState {
  const pathId = input.pathId.trim()
  if (!pathId) {
    throw new DomainError("LEARNER_STATE_EMPTY_PATH_ID", "pathId must be non-empty")
  }

  const next: DomainLearnerState = {
    ...state,
    pathId,
  }

  if (input.pathTitle !== undefined) {
    next.pathTitle = input.pathTitle
  }
  if (input.currentStepId !== undefined) {
    next.currentStepId = input.currentStepId
  }

  return withUpdatedAt(next, opts)
}

/**
 * Clear path fields while keeping learnerId / activeGoalId.
 */
export function clearPath(
  state: DomainLearnerState,
  opts?: DomainClockOptions,
): DomainLearnerState {
  return withUpdatedAt(
    {
      ...state,
      pathId: undefined,
      pathTitle: undefined,
      currentStepId: undefined,
    },
    opts,
  )
}
