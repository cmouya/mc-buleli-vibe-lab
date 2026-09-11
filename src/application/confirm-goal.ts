/**
 * Confirm Goal use case — orchestrates confirmation only.
 * Invariants remain in domain/adapters (analyzed required, I-01 not silently confirmed here).
 */

import {
  applyConfirmGoal,
  type LegacyGoalFields,
  type LegacyGoalPatch,
} from "../adapters/store/index.js"
import type { DomainClockOptions } from "../modules/shared/index.js"

export function confirmGoal(
  fields: LegacyGoalFields,
  opts?: DomainClockOptions,
): LegacyGoalPatch {
  return applyConfirmGoal(fields, opts)
}
