import { randomUUID } from "node:crypto"
import { describe, expect, it } from "vitest"
import { createGoal, markGoalAnalyzed, confirmGoal } from "../../src/modules/goals/index.js"
import {
  createDb,
  createDrizzleGoalRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-12T10:00:00.000Z"

describe("M4.2 — Goal repository (PostgreSQL)", () => {
  it("migrates, saves, and reads draft/analyzed/confirmed goals", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const repo = createDrizzleGoalRepository(db)

      const draft = createGoal({
        statement: "Draft goal",
        level: "debutant",
        hoursPerWeek: 4,
        intent: "personnel",
        id: randomUUID(),
      })
      const savedDraft = await repo.save(draft)
      expect(savedDraft.status).toBe("draft")
      expect(await repo.getById(savedDraft.id as string)).toEqual(savedDraft)

      const analyzed = markGoalAnalyzed(
        createGoal({
          statement: "Analyzed goal",
          level: "intermediaire",
          hoursPerWeek: 6,
          intent: "academique",
          id: randomUUID(),
        }),
        { now: NOW },
      )
      const savedAnalyzed = await repo.save(analyzed)
      expect(savedAnalyzed.status).toBe("analyzed")
      expect(savedAnalyzed.analyzedAt).toBe(NOW)

      const confirmed = confirmGoal(
        markGoalAnalyzed(
          createGoal({
            statement: "Confirmed goal",
            level: "avance",
            hoursPerWeek: 8,
            intent: "professionnel",
            id: randomUUID(),
          }),
          { now: NOW },
        ),
        { now: NOW },
      )
      const savedConfirmed = await repo.save(confirmed)
      expect(savedConfirmed.status).toBe("confirmed")
      expect(savedConfirmed.confirmedAt).toBe(NOW)
      expect(savedConfirmed.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )

      await expect(repo.getById(randomUUID())).resolves.toBeNull()
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("rejects invalid status via CHECK constraint", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      await expect(
        client`
          INSERT INTO goals (id, statement, level, hours_per_week, intent, status)
          VALUES (
            ${randomUUID()}::uuid,
            'Bad status',
            'debutant',
            5,
            'professionnel',
            'not-a-status'
          )
        `,
      ).rejects.toThrow()
    } finally {
      await client.end({ timeout: 5 })
    }
  })
})
