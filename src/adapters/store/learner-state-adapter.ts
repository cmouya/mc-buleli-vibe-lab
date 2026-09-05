/**
 * Store ↔ LearnerState domain adapter.
 * Path refs only — steps[] remain store-owned.
 */

import {
  bindActiveGoal,
  bindPath,
  createLearnerState,
} from "../../modules/learner/index.js"

export interface PathBindInput {
  pathId: string
  pathTitle?: string
}

/**
 * Fields to clear when the active goal changes.
 * pathId/pathTitle come from DomainLearnerState after bindActiveGoal
 * (domain clears path refs). steps/skills are legacy-only clears.
 *
 * Symbolic goal/path ids used here are ephemeral adapter fixtures only —
 * never persisted or exposed as real domain identifiers.
 */
export function pathClearPatchForGoalChange(): {
  pathId: string
  pathTitle: string
  steps: unknown[]
  skills: string[]
} {
  const withStalePath = bindPath(createLearnerState(), {
    pathId: "ephemeral-prior-path",
    pathTitle: "ephemeral-prior-title",
  })
  // bindActiveGoal clears path refs by domain invariant (no redundant clearPath)
  const afterGoalChange = bindActiveGoal(withStalePath, "legacy-goal-change")

  return {
    pathId: afterGoalChange.pathId ?? "",
    pathTitle: afterGoalChange.pathTitle ?? "",
    // Legacy store arrays — not part of DomainLearnerState
    steps: [],
    skills: [],
  }
}

/**
 * Bind path id/title refs via domain bindPath; steps stay in store.
 */
export function pathBindPatch(input: PathBindInput): {
  pathId: string
  pathTitle: string
} {
  const session = createLearnerState()
  const bound = bindPath(session, {
    pathId: input.pathId,
    pathTitle: input.pathTitle,
  })

  return {
    pathId: bound.pathId ?? "",
    pathTitle: bound.pathTitle ?? input.pathTitle ?? "",
  }
}
