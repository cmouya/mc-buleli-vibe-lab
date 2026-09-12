import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  confirmAndPersistGoal,
  persistGoal,
  type GoalRepository,
} from "../../../src/application/persist-goal.js"
import { createGoal, type Goal } from "../../../src/modules/goals/index.js"

const NOW = "2026-09-12T10:00:00.000Z"

const input = {
  statement: "Maîtriser Outlook",
  level: "debutant" as const,
  hoursPerWeek: 5,
  intent: "professionnel" as const,
  analyzed: true,
}

function memoryRepository(): GoalRepository & { records: Map<string, Goal> } {
  const records = new Map<string, Goal>()
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

describe("application — persistGoal", () => {
  it("assigns a UUID when the Goal has no id", async () => {
    const repo = memoryRepository()
    const draft = createGoal({
      statement: input.statement,
      level: input.level,
      hoursPerWeek: input.hoursPerWeek,
      intent: input.intent,
    })
    const saved = await persistGoal(draft, repo)
    expect(saved.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(repo.records.get(saved.id as string)?.status).toBe("draft")
  })
})

describe("application — confirmAndPersistGoal", () => {
  it("persists a confirmed Goal with id and timestamps", async () => {
    const repo = memoryRepository()
    const saved = await confirmAndPersistGoal(input, repo, { now: NOW })
    expect(saved.status).toBe("confirmed")
    expect(saved.id).toBeTruthy()
    expect(saved.analyzedAt).toBe(NOW)
    expect(saved.confirmedAt).toBe(NOW)
    expect(await repo.getById(saved.id as string)).toEqual(saved)
  })

  it("rejects unanalyzed goals without calling save", async () => {
    const repo = memoryRepository()
    await expect(
      confirmAndPersistGoal({ ...input, analyzed: false }, repo),
    ).rejects.toBeInstanceOf(DomainError)
    expect(repo.records.size).toBe(0)
  })
})
