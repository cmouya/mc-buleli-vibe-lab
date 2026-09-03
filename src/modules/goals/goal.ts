/**
 * Goal domain — pure functions (framework-independent).
 * Goal ≠ Skill. No LLM dependency.
 */

import type { GoalIntent, LearnerLevel } from "../../shared/types/learner.types.js"
import type { Goal } from "../../shared/types/domain.types.js"
import {
  DomainError,
  resolveNow,
  type DomainClockOptions,
} from "../shared/domain-error.js"

export type { Goal, DomainClockOptions }
export { DomainError }

export interface CreateGoalInput {
  statement: string
  level: LearnerLevel
  hoursPerWeek: number
  intent: GoalIntent
  id?: string
}

function normalizeStatement(statement: string): string {
  return statement.trim()
}

function assertNonEmptyStatement(statement: string): string {
  const normalized = normalizeStatement(statement)
  if (!normalized) {
    throw new DomainError("GOAL_EMPTY_STATEMENT", "Goal statement must be non-empty")
  }
  return normalized
}

/**
 * Create a Goal in draft status. Rejects empty/whitespace statements.
 */
export function createGoal(input: CreateGoalInput, opts?: DomainClockOptions): Goal {
  const statement = assertNonEmptyStatement(input.statement)
  if (!Number.isFinite(input.hoursPerWeek) || input.hoursPerWeek <= 0) {
    throw new DomainError("GOAL_INVALID_HOURS", "hoursPerWeek must be a positive number")
  }

  const goal: Goal = {
    statement,
    level: input.level,
    hoursPerWeek: input.hoursPerWeek,
    intent: input.intent,
    status: "draft",
  }

  if (input.id !== undefined) {
    goal.id = input.id
  }

  // opts reserved for future createdAt; keep signature stable for clock injection
  void opts
  return goal
}

/**
 * Mark a draft Goal as analyzed (no AI — status transition only).
 */
export function markGoalAnalyzed(goal: Goal, opts?: DomainClockOptions): Goal {
  if (goal.status === "achieved") {
    throw new DomainError("GOAL_INVALID_TRANSITION", "Cannot analyze an achieved goal")
  }
  assertNonEmptyStatement(goal.statement)

  return {
    ...goal,
    status: "analyzed",
    analyzedAt: resolveNow(opts),
  }
}

/**
 * Confirm a Goal. Requires non-empty statement. Enables path generation (I-01).
 */
export function confirmGoal(goal: Goal, opts?: DomainClockOptions): Goal {
  assertNonEmptyStatement(goal.statement)
  if (goal.status === "achieved") {
    throw new DomainError("GOAL_INVALID_TRANSITION", "Cannot confirm an achieved goal")
  }

  return {
    ...goal,
    status: "confirmed",
    confirmedAt: resolveNow(opts),
  }
}

export function isGoalConfirmed(goal: Goal): boolean {
  return goal.status === "confirmed" || goal.status === "achieved"
}

/**
 * I-01 — Goal before Content: path generation requires a confirmed goal.
 */
export function assertGoalReadyForPath(goal: Goal): void {
  if (!isGoalConfirmed(goal)) {
    throw new DomainError(
      "GOAL_NOT_CONFIRMED",
      "Goal must be confirmed before path generation",
    )
  }
  assertNonEmptyStatement(goal.statement)
}
