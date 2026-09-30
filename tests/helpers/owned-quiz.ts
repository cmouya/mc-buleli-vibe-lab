import { vi } from "vitest"
import { DomainError } from "../../src/modules/shared/index.js"
import type { OwnedQuizDefinition, OwnedStepQuizRepository } from "../../src/modules/evidence/index.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import {
  inertAuth, inertLearners, inertOwnedPaths,
  memoryOwnedGoals, memoryOwnedDerivedContent, memoryOwnedEvidence, memoryOwnedProgress,
} from "../api/inert-auth.js"

export const selections = [{ questionIndex: 0, selectedIndex: 1 }, { questionIndex: 1, selectedIndex: 0 }]
export const quiz: OwnedQuizDefinition = {
  minimumCorrectCount: 2,
  items: [
    { options: ["secret-wrong", "secret-right"], correctIndex: 1 },
    { options: ["secret-right", "secret-wrong"], correctIndex: 0 },
  ],
}
export const declared = { score: 2, maxScore: 2, passed: true,
  answers: selections.map((answer) => ({ ...answer, correct: true })) }

export function ownedQuizFixture() {
  const context: LearnerContext = { organizationId: "org-a", learnerId: "learner-a", userId: "user-a" }
  const ownedGoals = memoryOwnedGoals()
  ownedGoals.rows.push({ id: "goal-a", organizationId: "org-a", learnerId: "learner-a",
    statement: "Learn", level: "debutant", hoursPerWeek: 2, intent: "personnel", status: "confirmed" })
  const ownedDerived = memoryOwnedDerivedContent(ownedGoals.rows)
  ownedDerived.paths.push({ id: "path-a", goalId: "goal-a", title: "Path", steps: [
    { id: "step-a", position: 0, title: "Keyed", description: "" },
    { id: "step-b", position: 1, title: "Legacy", description: "" },
  ] })
  const ownedEvidence = memoryOwnedEvidence()
  // Share persisted rows with scoped GET reads.
  ownedEvidence.records = ownedDerived.evidenceRows
  ownedEvidence.saveOwned = vi.fn(async (item, scope, goalId) => {
    ownedEvidence.lastScope = scope
    ownedEvidence.lastGoalId = goalId
    const saved = { ...item, scoringProvenance: "client_declared" as const }
    ownedEvidence.records.push(saved)
    return saved
  })
  ownedEvidence.saveOwnedServerRecalculated = vi.fn(async (item, scope, goalId) => {
    ownedEvidence.lastScope = scope
    ownedEvidence.lastGoalId = goalId
    const saved = { ...item, scoringProvenance: "server_recalculated" as const }
    ownedEvidence.records.push(saved)
    return saved
  })
  const keys = new Map<string, OwnedQuizDefinition>([["step-a", structuredClone(quiz)]])
  const ownedQuizzes: OwnedStepQuizRepository = {
    getOwned: vi.fn(async (stepId, goalId, scope) => {
      if (!await ownedDerived.getOwnedStepById(stepId, goalId, scope)) {
        throw new DomainError("RESOURCE_NOT_FOUND", "Not found")
      }
      return keys.get(stepId) ?? null
    }),
    saveOwned: vi.fn(async () => { throw new Error("No authoring in submission") }),
  }
  const auth = inertAuth()
  auth.sessions.getByTokenHash = async (hash) => {
    const userId = hash === "sha:owner" ? "user-a" : hash === "sha:other" ? "user-b" : null
    return userId ? { id: `session-${userId}`, userId, tokenHash: hash,
      createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), revokedAt: null } : null
  }
  auth.users.getById = async (id) => ({ id, createdAt: new Date().toISOString() })
  auth.memberships.listByUserId = async (userId) => ["org-a", "org-b"].map((organizationId) => ({
    id: `${userId}-${organizationId}`, userId, organizationId, role: "member", createdAt: new Date().toISOString(),
  }))
  const learners = inertLearners()
  learners.getByOrganizationAndUserId = async (organizationId, userId) => ({
    id: organizationId === "org-a" && userId === "user-a" ? "learner-a" : "learner-other",
    organizationId, userId, createdAt: new Date().toISOString(),
  })
  const options = { auth, learners, ownedGoals, ownedDerived, ownedEvidence, ownedQuizzes,
    ownedPaths: inertOwnedPaths(),
    ownedProgress: memoryOwnedProgress(ownedGoals.rows, ownedDerived.paths, ownedEvidence.records) }
  return { context, keys, options, ...options }
}
