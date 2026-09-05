export {
  toDomainGoal,
  applyCreateProfile,
  applyMarkAnalyzed,
  applyConfirmGoal,
  assertGoalReadyForPathFromLegacy,
} from "./goal-adapter.js"

export type {
  LegacyGoalFields,
  ProfileInput,
  LegacyGoalPatch,
} from "./goal-adapter.js"

export { pathClearPatchForGoalChange, pathBindPatch } from "./learner-state-adapter.js"
export type { PathBindInput } from "./learner-state-adapter.js"
