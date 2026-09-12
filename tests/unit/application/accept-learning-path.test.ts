import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  confirmGoal,
  createGoal,
  markGoalAnalyzed,
  type Goal,
  type GoalRepository,
} from "../../../src/modules/goals/index.js"
import type {
  AcceptedLearningPath,
  LearningPathRepository,
} from "../../../src/modules/learning-path/index.js"
import { acceptLearningPath } from "../../../src/application/accept-learning-path.js"
import type { GeneratedPath } from "../../../src/application/generate-learning-path.js"

const NOW = "2026-09-12T16:00:00.000Z"

const proposal: GeneratedPath = {
  pathId: "ia-pro",
  pathTitle: "IA pour développer votre activité",
  summary: "proposal",
  steps: [
    { id: "ia-1", title: "Fondamentaux", description: "Bases", skill: "Culture IA" },
    { id: "ia-2", title: "ChatGPT", description: "" },
  ],
}

function memoryGoalRepository(seed?: Goal): GoalRepository & { records: Map<string, Goal> } {
  const records = new Map<string, Goal>()
  if (seed?.id) {
    records.set(seed.id, seed)
  }
  return {
    records,
    async save(goal) {
      if (!goal.id) {
        throw new Error("id required")
      }
      records.set(goal.id, goal)
      return goal
    },
    async getById(id) {
      return records.get(id) ?? null
    },
  }
}

function memoryPathRepository(): LearningPathRepository & {
  records: Map<string, AcceptedLearningPath>
} {
  const records = new Map<string, AcceptedLearningPath>()
  return {
    records,
    async save(path) {
      records.set(path.id, path)
      return path
    },
    async getById(id) {
      return records.get(id) ?? null
    },
    async getByGoalId(goalId) {
      return [...records.values()].filter((path) => path.goalId === goalId)
    },
  }
}

function confirmedGoal(): Goal {
  return confirmGoal(
    markGoalAnalyzed(
      createGoal({
        statement: "Maîtriser l'IA",
        level: "debutant",
        hoursPerWeek: 5,
        intent: "professionnel",
        id: "11111111-1111-4111-8111-111111111111",
      }),
      { now: NOW },
    ),
    { now: NOW },
  )
}

describe("application — acceptLearningPath", () => {
  it("accepts a proposal against a confirmed Goal and assigns durable UUIDs", async () => {
    const goal = confirmedGoal()
    const goals = memoryGoalRepository(goal)
    const paths = memoryPathRepository()
    const saved = await acceptLearningPath(
      { goalId: goal.id as string, proposal },
      goals,
      paths,
    )
    expect(saved.goalId).toBe(goal.id)
    expect(saved.title).toBe(proposal.pathTitle)
    expect(saved.sourcePathId).toBe("ia-pro")
    expect(saved.id).not.toBe("ia-pro")
    expect(saved.steps).toHaveLength(2)
    expect(saved.steps[0]?.sourceStepId).toBe("ia-1")
    expect(saved.steps[0]?.id).not.toBe("ia-1")
    expect(saved.steps[0]?.position).toBe(0)
    expect(saved.steps[1]?.position).toBe(1)
    expect(JSON.stringify(saved)).not.toMatch(/todo|current|done/)
  })

  it("rejects an unconfirmed Goal via domain I-01 without saving", async () => {
    const draft = createGoal({
      statement: "Draft only",
      level: "debutant",
      hoursPerWeek: 5,
      intent: "professionnel",
      id: "22222222-2222-4222-8222-222222222222",
    })
    const goals = memoryGoalRepository(draft)
    const paths = memoryPathRepository()
    await expect(
      acceptLearningPath({ goalId: draft.id as string, proposal }, goals, paths),
    ).rejects.toMatchObject({ code: "GOAL_NOT_CONFIRMED" })
    expect(paths.records.size).toBe(0)
  })

  it("rejects a missing Goal without saving", async () => {
    const paths = memoryPathRepository()
    await expect(
      acceptLearningPath(
        { goalId: "33333333-3333-4333-8333-333333333333", proposal },
        memoryGoalRepository(),
        paths,
      ),
    ).rejects.toBeInstanceOf(DomainError)
    expect(paths.records.size).toBe(0)
  })

  it("delegates I-01 to domain assertGoalReadyForPath and does not persist generate", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/accept-learning-path.ts"),
      "utf8",
    )
    expect(source).toMatch(/assertGoalReadyForPath/)
    expect(source).not.toMatch(/GOAL_NOT_CONFIRMED/)
    expect(source).not.toMatch(/setPath/)
    expect(source).not.toMatch(/generateLearningPath/)
  })
})
