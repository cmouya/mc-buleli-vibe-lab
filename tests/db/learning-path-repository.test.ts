import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { confirmGoal, createGoal, markGoalAnalyzed } from "../../src/modules/goals/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createDrizzleLearningPathRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-12T16:00:00.000Z"

function acceptedPath(goalId: string): AcceptedLearningPath {
  return {
    id: randomUUID(),
    goalId,
    title: "IA pour développer votre activité",
    summary: "accepted",
    sourcePathId: "ia-pro",
    steps: [
      {
        id: randomUUID(),
        position: 0,
        title: "Fondamentaux",
        description: "Bases",
        sourceStepId: "ia-1",
      },
      {
        id: randomUUID(),
        position: 1,
        title: "ChatGPT",
        description: "",
        sourceStepId: "ia-2",
      },
    ],
  }
}

describe("M4.3 — Learning path repository (PostgreSQL)", () => {
  it("saves and reads an accepted path with ordered steps", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const goals = createDrizzleGoalRepository(db)
      const paths = createDrizzleLearningPathRepository(db)
      const goal = await goals.save(
        confirmGoal(
          markGoalAnalyzed(
            createGoal({
              statement: "Path persist goal",
              level: "debutant",
              hoursPerWeek: 5,
              intent: "professionnel",
              id: randomUUID(),
            }),
            { now: NOW },
          ),
          { now: NOW },
        ),
      )
      const path = acceptedPath(goal.id as string)
      const saved = await paths.save(path)
      expect(saved.id).toBe(path.id)
      expect(saved.steps.map((step) => step.title)).toEqual(["Fondamentaux", "ChatGPT"])
      expect(await paths.getById(saved.id)).toEqual(saved)
      expect(await paths.getByGoalId(goal.id as string)).toEqual([saved])
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects a path whose goal_id does not exist", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const paths = createDrizzleLearningPathRepository(db)
      await expect(paths.save(acceptedPath(randomUUID()))).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects a negative step position via CHECK", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const goals = createDrizzleGoalRepository(db)
      const goal = await goals.save(
        confirmGoal(
          markGoalAnalyzed(
            createGoal({
              statement: "Constraint goal",
              level: "debutant",
              hoursPerWeek: 3,
              intent: "personnel",
              id: randomUUID(),
            }),
            { now: NOW },
          ),
          { now: NOW },
        ),
      )
      const pathId = randomUUID()
      await client`
        INSERT INTO learning_paths (id, goal_id, title)
        VALUES (${pathId}::uuid, ${goal.id}::uuid, 'Constraint path')
      `
      await expect(
        client`
          INSERT INTO learning_path_steps (id, path_id, position, title)
          VALUES (${randomUUID()}::uuid, ${pathId}::uuid, -1, 'Bad')
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
