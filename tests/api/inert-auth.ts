import type { LearnerRepository, LoginDependencies, OwnedDerivedContentRepository, OwnedEvidenceRepository, OwnedGoalRepository, OwnedLearningPathRepository } from "../../src/application/index.js"
import type { Goal } from "../../src/modules/goals/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import type { Evidence } from "../../src/modules/evidence/index.js"

/** In-memory auth ports so API tests can start the full route table without Postgres. */
export function inertAuth(): LoginDependencies {
  return {
    credentials: {
      async save(item) {
        return item
      },
      async getById() {
        return null
      },
      async getByTypeAndIdentifier() {
        return null
      },
    },
    users: {
      async save(item) {
        return item
      },
      async getById() {
        return null
      },
    },
    memberships: {
      async save(item) {
        return item
      },
      async getById() {
        return null
      },
      async listByUserId() {
        return []
      },
    },
    sessions: {
      async save(item) {
        return item
      },
      async getByTokenHash() {
        return null
      },
      async revokeByTokenHash() {},
    },
    hasher: {
      async hash() {
        throw new Error("login must not hash passwords")
      },
      async verify() {
        return false
      },
      dummyHash() {
        return "h:dummy"
      },
      needsRehash() {
        return false
      },
    },
    tokens: {
      issue() {
        return "unused"
      },
    },
    digest: {
      digest(raw) {
        return `sha:${raw}`
      },
    },
  }
}

export function inertLearners(): LearnerRepository {
  return {
    async save(item) {
      return item
    },
    async getByOrganizationAndUserId() {
      return null
    },
  }
}

export function inertOwnedGoals(): OwnedGoalRepository {
  return {
    async saveOwned(item) {
      return item
    },
    async getOwnedById() {
      return null
    },
  }
}

export function memoryOwnedGoals(): OwnedGoalRepository & { rows: Goal[] } {
  const rows: Goal[] = []
  return {
    rows,
    async saveOwned(goal, scope) {
      const owned: Goal = {
        ...goal,
        organizationId: scope.organizationId,
        learnerId: scope.learnerId,
      }
      rows.push(owned)
      return owned
    },
    async getOwnedById(goalId, scope) {
      return (
        rows.find(
          (goal) =>
            goal.id === goalId &&
            goal.organizationId === scope.organizationId &&
            goal.learnerId === scope.learnerId,
        ) ?? null
      )
    },
  }
}

export function inertOwnedDerivedContent(): OwnedDerivedContentRepository {
  return {
    async getOwnedPathByGoalId() {
      return null
    },
    async getOwnedStepById() {
      return null
    },
    async getOwnedEvidenceById() {
      return null
    },
  }
}

export function inertOwnedPaths(): OwnedLearningPathRepository {
  return {
    async saveOwned() {
      throw new Error("owned Path writes are not used in this test")
    },
  }
}

export function inertOwnedEvidence(): OwnedEvidenceRepository {
  return {
    async saveOwned() {
      throw new Error("owned Evidence writes are not used in this test")
    },
  }
}

export function memoryOwnedEvidence(): OwnedEvidenceRepository & {
  records: Evidence[]
  lastScope: { organizationId: string; learnerId: string } | null
  lastGoalId: string | null
} {
  const records: Evidence[] = []
  return {
    records,
    lastScope: null,
    lastGoalId: null,
    async saveOwned(item, scope, goalId) {
      this.lastScope = { organizationId: scope.organizationId, learnerId: scope.learnerId }
      this.lastGoalId = goalId
      records.push(item)
      return item
    },
  }
}

export function memoryOwnedPaths(): OwnedLearningPathRepository & {
  records: AcceptedLearningPath[]
  lastScope: { organizationId: string; learnerId: string } | null
} {
  const records: AcceptedLearningPath[] = []
  return {
    records,
    lastScope: null,
    async saveOwned(path, scope) {
      this.lastScope = { organizationId: scope.organizationId, learnerId: scope.learnerId }
      records.push(path)
      return path
    },
  }
}

export function memoryOwnedDerivedContent(goals: Goal[]) {
  const paths: AcceptedLearningPath[] = []
  const evidenceRows: Evidence[] = []

  function ownedGoal(goalId: string, organizationId: string, learnerId: string) {
    return goals.find(
      (goal) =>
        goal.id === goalId &&
        goal.organizationId === organizationId &&
        goal.learnerId === learnerId,
    )
  }

  return {
    paths,
    evidenceRows,
    async getOwnedPathByGoalId(goalId, scope) {
      if (!ownedGoal(goalId, scope.organizationId, scope.learnerId)) {
        return null
      }
      return paths.find((path) => path.goalId === goalId) ?? null
    },
    async getOwnedStepById(stepId, goalId, scope) {
      if (!ownedGoal(goalId, scope.organizationId, scope.learnerId)) {
        return null
      }
      const path = paths.find(
        (item) => item.goalId === goalId && item.steps.some((step) => step.id === stepId),
      )
      return path?.steps.find((step) => step.id === stepId) ?? null
    },
    async getOwnedEvidenceById(evidenceId, goalId, scope) {
      if (!ownedGoal(goalId, scope.organizationId, scope.learnerId)) {
        return null
      }
      const item = evidenceRows.find((row) => row.id === evidenceId)
      if (!item) {
        return null
      }
      const path = paths.find(
        (row) => row.goalId === goalId && row.steps.some((step) => step.id === item.stepId),
      )
      return path ? item : null
    },
  } satisfies OwnedDerivedContentRepository & {
    paths: AcceptedLearningPath[]
    evidenceRows: Evidence[]
  }
}
