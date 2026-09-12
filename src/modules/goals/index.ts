export {
  DomainError,
  createGoal,
  markGoalAnalyzed,
  confirmGoal,
  isGoalConfirmed,
  assertGoalReadyForPath,
} from "./goal.js"

export type { Goal, CreateGoalInput, DomainClockOptions } from "./goal.js"
export type { GoalRepository } from "./goal-repository.js"
