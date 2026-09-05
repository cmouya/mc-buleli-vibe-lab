/**
 * Store ↔ Goal domain adapter.
 * Translates flat legacy state; does not persist or own UI.
 * Confirm (human CTA) is separate from assert-ready-for-path (setPath).
 */

import type { GoalIntent, LearnerLevel } from "../../shared/types/learner.types.js"
import type { Goal } from "../../shared/types/domain.types.js"
import {
  assertGoalReadyForPath,
  confirmGoal,
  createGoal,
  isGoalConfirmed,
  markGoalAnalyzed,
  type DomainClockOptions,
} from "../../modules/goals/index.js"
import { DomainError } from "../../modules/shared/index.js"
import { pathClearPatchForGoalChange } from "./learner-state-adapter.js"

export interface LegacyGoalFields {
  goal: string
  level: string
  hoursPerWeek: number
  intent: string
  analyzed: boolean
  confirmed: boolean
}

export interface ProfileInput {
  goal: string
  level: string
  hoursPerWeek: number
  intent?: string
}

export type LegacyGoalPatch = Partial<LegacyGoalFields> & {
  pathId?: string
  pathTitle?: string
  steps?: unknown[]
  skills?: string[]
}

const VALID_LEVELS: readonly LearnerLevel[] = ["debutant", "intermediaire", "avance"]
const VALID_INTENTS: readonly GoalIntent[] = ["professionnel", "personnel", "academique"]

function asLearnerLevel(level: string): LearnerLevel {
  if ((VALID_LEVELS as readonly string[]).includes(level)) {
    return level as LearnerLevel
  }
  return "debutant"
}

function asGoalIntent(intent: string): GoalIntent {
  if ((VALID_INTENTS as readonly string[]).includes(intent)) {
    return intent as GoalIntent
  }
  return "professionnel"
}

/**
 * Map flat legacy flags to a domain Goal (ephemeral — not a second store).
 */
export function toDomainGoal(fields: LegacyGoalFields): Goal {
  const base = createGoal({
    statement: fields.goal,
    level: asLearnerLevel(fields.level),
    hoursPerWeek: fields.hoursPerWeek,
    intent: asGoalIntent(fields.intent),
  })

  if (fields.confirmed) {
    return {
      ...base,
      status: "confirmed",
    }
  }
  if (fields.analyzed) {
    return {
      ...base,
      status: "analyzed",
    }
  }
  return base
}

/**
 * Create draft Goal from profile input; clear path + analyzed/confirmed.
 */
export function applyCreateProfile(
  input: ProfileInput,
  opts?: DomainClockOptions,
): LegacyGoalPatch {
  const intent = input.intent ?? "professionnel"
  const goal = createGoal(
    {
      statement: input.goal,
      level: asLearnerLevel(input.level),
      hoursPerWeek: input.hoursPerWeek,
      intent: asGoalIntent(intent),
    },
    opts,
  )

  const pathClear = pathClearPatchForGoalChange()

  return {
    goal: goal.statement,
    level: goal.level,
    hoursPerWeek: goal.hoursPerWeek,
    intent: goal.intent,
    analyzed: false,
    confirmed: false,
    ...pathClear,
  }
}

/**
 * Map setAnalyzed(true|false). Un-analyze clears confirmed.
 */
export function applyMarkAnalyzed(
  fields: LegacyGoalFields,
  analyzed: boolean,
  opts?: DomainClockOptions,
): LegacyGoalPatch {
  if (!analyzed) {
    const draft = createGoal({
      statement: fields.goal,
      level: asLearnerLevel(fields.level),
      hoursPerWeek: fields.hoursPerWeek,
      intent: asGoalIntent(fields.intent),
    })
    return {
      goal: draft.statement,
      level: draft.level,
      hoursPerWeek: draft.hoursPerWeek,
      intent: draft.intent,
      analyzed: false,
      confirmed: false,
    }
  }

  const current = toDomainGoal({ ...fields, analyzed: false, confirmed: false })
  const marked = markGoalAnalyzed(current, opts)
  return {
    analyzed: marked.status === "analyzed",
    confirmed: false,
  }
}

/**
 * Explicit human confirmation (Confirmation CTA). Requires analyzed goal.
 */
export function applyConfirmGoal(
  fields: LegacyGoalFields,
  opts?: DomainClockOptions,
): LegacyGoalPatch {
  if (!fields.analyzed) {
    throw new DomainError(
      "GOAL_NOT_ANALYZED",
      "Goal must be analyzed before confirmation",
    )
  }

  const current = toDomainGoal({ ...fields, confirmed: false })
  const confirmed = confirmGoal(current, opts)
  return {
    confirmed: isGoalConfirmed(confirmed),
    analyzed: true,
  }
}

/**
 * I-01 assert only — MUST NOT call confirmGoal.
 */
export function assertGoalReadyForPathFromLegacy(fields: LegacyGoalFields): void {
  const goal = toDomainGoal(fields)
  assertGoalReadyForPath(goal)
}
