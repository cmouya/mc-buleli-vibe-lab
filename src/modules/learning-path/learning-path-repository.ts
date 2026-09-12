import type { AcceptedLearningPath } from "./accepted-path.js"

export interface LearningPathRepository {
  save(path: AcceptedLearningPath): Promise<AcceptedLearningPath>
  getById(id: string): Promise<AcceptedLearningPath | null>
  getByGoalId(goalId: string): Promise<AcceptedLearningPath[]>
}
