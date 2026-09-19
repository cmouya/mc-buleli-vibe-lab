import type { Learner } from "./learner.js"

export interface LearnerRepository {
  save(learner: Learner): Promise<Learner>
  getByOrganizationAndUserId(organizationId: string, userId: string): Promise<Learner | null>
}
