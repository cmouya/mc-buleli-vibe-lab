import { describe, expect, it } from "vitest"
import {
  getOwnedEvidence,
  getOwnedPath,
  getOwnedStep,
} from "../../../src/application/get-owned-derived-content.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import type { Evidence } from "../../../src/modules/evidence/index.js"
import type { Goal } from "../../../src/modules/goals/index.js"
import type {
  AcceptedLearningPath,
  OwnedDerivedContentRepository,
} from "../../../src/modules/learning-path/index.js"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function contextB(): LearnerContext {
  return { learnerId: "lrn-b", userId: "user-u", organizationId: "org-b" }
}

function contextA2(): LearnerContext {
  return { learnerId: "lrn-a2", userId: "user-2", organizationId: "org-a" }
}

function memoryGraph() {
  const goals: Goal[] = [
    {
      id: "goal-a",
      statement: "A",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "personnel",
      status: "draft",
      organizationId: "org-a",
      learnerId: "lrn-a",
    },
    {
      id: "goal-b",
      statement: "B",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "personnel",
      status: "draft",
      organizationId: "org-b",
      learnerId: "lrn-b",
    },
    {
      id: "legacy",
      statement: "Legacy",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "personnel",
      status: "draft",
    },
  ]
  const paths: AcceptedLearningPath[] = [
    {
      id: "path-a",
      goalId: "goal-a",
      title: "Path A",
      steps: [{ id: "step-a", position: 0, title: "Step A", description: "" }],
    },
    {
      id: "path-b",
      goalId: "goal-b",
      title: "Path B",
      steps: [{ id: "step-b", position: 0, title: "Step B", description: "" }],
    },
    {
      id: "path-legacy",
      goalId: "legacy",
      title: "Legacy path",
      steps: [{ id: "step-legacy", position: 0, title: "Legacy step", description: "" }],
    },
  ]
  const evidenceRows: Evidence[] = [
    {
      id: "ev-a",
      stepId: "step-a",
      type: "quiz_attempt",
      score: 1,
      maxScore: 1,
      passed: true,
      answers: [],
      recordedAt: "2026-09-19T12:00:00.000Z",
    },
    {
      id: "ev-legacy",
      stepId: "step-legacy",
      type: "quiz_attempt",
      score: 1,
      maxScore: 1,
      passed: true,
      answers: [],
      recordedAt: "2026-09-19T12:00:00.000Z",
    },
  ]

  const repository: OwnedDerivedContentRepository = {
    async getOwnedPathByGoalId(goalId, scope) {
      const owned = goals.find(
        (goal) =>
          goal.id === goalId &&
          goal.organizationId === scope.organizationId &&
          goal.learnerId === scope.learnerId,
      )
      if (!owned) {
        return null
      }
      return paths.find((path) => path.goalId === goalId) ?? null
    },
    async getOwnedStepById(stepId, goalId, scope) {
      const path = await this.getOwnedPathByGoalId(goalId, scope)
      return path?.steps.find((step) => step.id === stepId) ?? null
    },
    async getOwnedEvidenceById(evidenceId, goalId, scope) {
      const path = await this.getOwnedPathByGoalId(goalId, scope)
      if (!path) {
        return null
      }
      const item = evidenceRows.find((row) => row.id === evidenceId)
      if (!item || !path.steps.some((step) => step.id === item.stepId)) {
        return null
      }
      return item
    },
  }
  return repository
}

describe("application — getOwnedPath / getOwnedStep / getOwnedEvidence", () => {
  it("returns descendants only through the owned Goal chain", async () => {
    const repository = memoryGraph()
    const path = await getOwnedPath("goal-a", contextA(), repository)
    expect(path?.id).toBe("path-a")
    expect(await getOwnedStep("step-a", "goal-a", contextA(), repository)).toMatchObject({
      id: "step-a",
    })
    expect(await getOwnedEvidence("ev-a", "goal-a", contextA(), repository)).toMatchObject({
      id: "ev-a",
    })
  })

  it("does not return Path/Step/Evidence to another org or learner", async () => {
    const repository = memoryGraph()
    expect(await getOwnedPath("goal-a", contextB(), repository)).toBeNull()
    expect(await getOwnedPath("goal-a", contextA2(), repository)).toBeNull()
    expect(await getOwnedStep("step-a", "goal-a", contextB(), repository)).toBeNull()
    expect(await getOwnedEvidence("ev-a", "goal-a", contextB(), repository)).toBeNull()
  })

  it("does not expose a Step or Evidence under a forged unrelated Goal", async () => {
    const repository = memoryGraph()
    expect(await getOwnedStep("step-a", "goal-b", contextA(), repository)).toBeNull()
    expect(await getOwnedStep("step-a", "goal-b", contextB(), repository)).toBeNull()
    expect(await getOwnedEvidence("ev-a", "goal-b", contextA(), repository)).toBeNull()
    expect(await getOwnedEvidence("ev-a", "goal-b", contextB(), repository)).toBeNull()
  })

  it("fails closed for descendants of unowned legacy Goals", async () => {
    const repository = memoryGraph()
    expect(await getOwnedPath("legacy", contextA(), repository)).toBeNull()
    expect(await getOwnedStep("step-legacy", "legacy", contextA(), repository)).toBeNull()
    expect(await getOwnedEvidence("ev-legacy", "legacy", contextA(), repository)).toBeNull()
  })

  it("isolates two organizations for the same User", async () => {
    const repository = memoryGraph()
    expect((await getOwnedPath("goal-a", contextA(), repository))?.id).toBe("path-a")
    expect((await getOwnedPath("goal-b", contextB(), repository))?.id).toBe("path-b")
    expect(await getOwnedPath("goal-a", contextB(), repository)).toBeNull()
    expect(await getOwnedPath("goal-b", contextA(), repository)).toBeNull()
  })

  it("keeps get-owned-derived-content free of infrastructure stacks", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../src/application/get-owned-derived-content.ts",
      ),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
    expect(source).not.toMatch(/getById\(/)
  })
})
