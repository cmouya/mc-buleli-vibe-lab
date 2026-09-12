import { describe, expect, it } from "vitest"
import { migrateDatabase, pingDatabase, requireDatabaseUrl } from "../../src/infra/db/index.js"

describe("M4.1 — PostgreSQL + Drizzle infrastructure", () => {
  it("applies migrations and pings the database with SELECT 1", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    await expect(pingDatabase(url)).resolves.toBe(true)
  })
})
