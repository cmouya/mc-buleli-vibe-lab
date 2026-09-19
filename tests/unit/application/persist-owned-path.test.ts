import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { persistOwnedPath } from "../../../src/application/persist-owned-path.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import type { GeneratedPath } from "../../../src/application/generate-learning-path.js"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  confirmGoal,
  createGoal,
  markGoalAnalyzed,
  type Goal,
  type OwnedGoalRepository,
} from "../../../src/modules/goals/index.js"
import type {
  AcceptedLearningPath,
  OwnedLearningPathRepository,
} from "../../../src/modules/learning-path/index.js"

const NOW = "2026-09-12T16:00:00.000Z"

const proposal: GeneratedPath = {
  pathId: "ia-pro",
  pathTitle: "IA pour développer votre activité",
  summary: "proposal",
  steps: [
    { id: "ia-1", title: "Fondamentaux", description: "Bases" },
    { id: "ia-2", title: "ChatGPT", description: "" },
  ],
}

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function contextB(): LearnerContext {
  return { learnerId: "lrn-b", userId: "user-u", organizationId: "org-b" }
}

function contextA2(): LearnerContext {
  return { learnerId: "lrn-a2", userId: "user-2", organizationId: "org-a" }
}

function ownedConfirmed(id: string, organizationId: string, learnerId: string): Goal {
  return {
    ...confirmGoal(
      markGoalAnalyzed(
        createGoal({
          statement: "Maîtriser l'IA",
          level: "debutant",
          hoursPerWeek: 5,
          intent: "professionnel",
          id,
        }),
        { now: NOW },
      ),
      { now: NOW },
    ),
    organizationId,
    learnerId,
  }
}

function memoryOwnedGoals(seed: Goal[] = []): OwnedGoalRepository & { rows: Goal[] } {
  const rows = [...seed]
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

function memoryOwnedPaths(): OwnedLearningPathRepository & {
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

describe("application — persistOwnedPath", () => {
  it("persists an accepted Path under an accessible owned Goal", async () => {
    const goal = ownedConfirmed("11111111-1111-4111-8111-111111111111", "org-a", "lrn-a")
    const goals = memoryOwnedGoals([goal])
    const paths = memoryOwnedPaths()
    const saved = await persistOwnedPath(
      { goalId: goal.id as string, proposal },
      contextA(),
      goals,
      paths,
    )
    expect(saved.goalId).toBe(goal.id)
    expect(saved.title).toBe(proposal.pathTitle)
    expect(saved.steps).toHaveLength(2)
    expect(saved.steps[0]?.sourceStepId).toBe("ia-1")
    expect(saved.steps[0]?.id).not.toBe("ia-1")
    expect(saved.steps[1]?.position).toBe(1)
    expect(paths.records).toHaveLength(1)
    expect(paths.lastScope).toEqual({ organizationId: "org-a", learnerId: "lrn-a" })
  })

  it("stamps path.goalId from the authorized Goal, not forged input ownership", async () => {
    const goal = ownedConfirmed("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "org-a", "lrn-a")
    const goals = memoryOwnedGoals([goal])
    const paths = memoryOwnedPaths()
    const saved = await persistOwnedPath(
      {
        goalId: goal.id as string,
        proposal,
        organizationId: "org-forged",
        learnerId: "lrn-forged",
      },
      contextA(),
      goals,
      paths,
    )
    expect(saved.goalId).toBe(goal.id)
    expect(paths.lastScope).toEqual({ organizationId: "org-a", learnerId: "lrn-a" })
    expect(paths.lastScope?.organizationId).not.toBe("org-forged")
    expect(paths.lastScope?.learnerId).not.toBe("lrn-forged")
  })

  it("does not persist for an unknown Goal with the same failure as inaccessible", async () => {
    const paths = memoryOwnedPaths()
    const unknown = persistOwnedPath(
      { goalId: "00000000-0000-4000-8000-000000000000", proposal },
      contextA(),
      memoryOwnedGoals(),
      paths,
    )
    const otherOrgGoal = ownedConfirmed("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "org-b", "lrn-b")
    const inaccessible = persistOwnedPath(
      { goalId: otherOrgGoal.id as string, proposal },
      contextA(),
      memoryOwnedGoals([otherOrgGoal]),
      paths,
    )
    await expect(unknown).rejects.toMatchObject({ code: "GOAL_NOT_FOUND", message: "Goal not found" })
    await expect(inaccessible).rejects.toMatchObject({
      code: "GOAL_NOT_FOUND",
      message: "Goal not found",
    })
    expect(paths.records).toHaveLength(0)
  })

  it("cannot persist across organization or wrong Learner", async () => {
    const goal = ownedConfirmed("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "org-a", "lrn-a")
    const goals = memoryOwnedGoals([goal])
    const paths = memoryOwnedPaths()
    await expect(
      persistOwnedPath({ goalId: goal.id as string, proposal }, contextB(), goals, paths),
    ).rejects.toBeInstanceOf(DomainError)
    await expect(
      persistOwnedPath({ goalId: goal.id as string, proposal }, contextA2(), goals, paths),
    ).rejects.toBeInstanceOf(DomainError)
    expect(paths.records).toHaveLength(0)
  })

  it("does not treat unowned legacy Goals as owned", async () => {
    const legacy = confirmGoal(
      markGoalAnalyzed(
        createGoal({
          statement: "Legacy",
          level: "debutant",
          hoursPerWeek: 4,
          intent: "personnel",
          id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        }),
        { now: NOW },
      ),
      { now: NOW },
    )
    const goals = memoryOwnedGoals([legacy])
    const paths = memoryOwnedPaths()
    await expect(
      persistOwnedPath({ goalId: legacy.id as string, proposal }, contextA(), goals, paths),
    ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" })
    expect(paths.records).toHaveLength(0)
  })

  it("authorizes through OwnedGoalRepository.getOwnedById and has no global getById", async () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/persist-owned-path.ts"),
      "utf8",
    )
    expect(source).toMatch(/getOwnedById/)
    expect(source).not.toMatch(/goalRepository\.getById/)
    expect(source).not.toMatch(/type GoalRepository/)
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/postgres/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
