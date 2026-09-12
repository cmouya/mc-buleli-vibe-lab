import type { Goal } from "../../shared/types/domain.types.js"

export interface GoalRepository {
  save(goal: Goal): Promise<Goal>
  getById(id: string): Promise<Goal | null>
}
