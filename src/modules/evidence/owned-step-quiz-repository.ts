import type { GoalOwnerScope } from "../goals/owned-goal-repository.js"
import type { OwnedQuizDefinition } from "./score-owned-quiz.js"

export type { GoalOwnerScope }

/**
 * Step-owned answer key. Ownership is Step → Path → Goal for the scope.
 * There is no stepId-only read or write.
 */
export interface OwnedStepQuizRepository {
  saveOwned(
    stepId: string,
    goalId: string,
    scope: GoalOwnerScope,
    quiz: OwnedQuizDefinition,
  ): Promise<OwnedQuizDefinition>
  getOwned(
    stepId: string,
    goalId: string,
    scope: GoalOwnerScope,
  ): Promise<OwnedQuizDefinition | null>
}
