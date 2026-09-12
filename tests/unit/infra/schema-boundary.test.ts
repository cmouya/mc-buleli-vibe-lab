import { SCHEMA_SLICE } from "../../../src/infra/db/schema.js"
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const modulesDir = join(dirname(fileURLToPath(import.meta.url)), "../../../src/modules")
const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "../../../src/infra/db/schema.ts")

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(full))
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
      files.push(full)
    }
  }
  return files
}

describe("infra — M4.3 schema boundary", () => {
  it("persists Goal and accepted path steps — no evidence or identity tables", () => {
    expect(SCHEMA_SLICE).toBe("m4.3-accepted-path")
    const source = readFileSync(schemaPath, "utf8")
    expect(source).toMatch(/pgTable\(\s*"goals"/)
    expect(source).toMatch(/pgTable\(\s*"learning_paths"/)
    expect(source).toMatch(/pgTable\(\s*"learning_path_steps"/)
    expect(source).not.toMatch(/Evidence/)
    expect(source).not.toMatch(/\bUser\b/)
    expect(source).not.toMatch(/Organization/)
    expect(source).not.toMatch(/Session/)
    expect(source).not.toMatch(/learner_id/)
    expect(source).not.toMatch(/user_id/)
    expect(source).not.toMatch(/organization_id/)
    expect(source).not.toMatch(/todo/)
    expect(source).not.toMatch(/current/)
  })

  it("keeps domain modules free of Drizzle", () => {
    const files = listSourceFiles(modulesDir)
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const source = readFileSync(file, "utf8")
      expect(source, file).not.toMatch(/drizzle-orm/)
      expect(source, file).not.toMatch(/drizzle-kit/)
    }
  })
})
