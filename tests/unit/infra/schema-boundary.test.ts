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

function tableBlock(source: string, exportName: string): string {
  const start = source.indexOf(`export const ${exportName}`)
  expect(start).toBeGreaterThanOrEqual(0)
  const next = source.indexOf("export const ", start + 1)
  return next === -1 ? source.slice(start) : source.slice(start, next)
}

describe("infra — M5.1 schema boundary", () => {
  it("adds identity island tables without owning the M4 spine or sessions", () => {
    expect(SCHEMA_SLICE).toBe("m5.1-identity")
    const source = readFileSync(schemaPath, "utf8")
    expect(source).toMatch(/pgTable\(\s*"goals"/)
    expect(source).toMatch(/pgTable\(\s*"learning_paths"/)
    expect(source).toMatch(/pgTable\(\s*"learning_path_steps"/)
    expect(source).toMatch(/pgTable\(\s*"evidence"/)
    expect(source).toMatch(/pgTable\(\s*"organizations"/)
    expect(source).toMatch(/pgTable\(\s*"users"/)
    expect(source).toMatch(/pgTable\(\s*"user_credentials"/)
    expect(source).toMatch(/pgTable\(\s*"organization_memberships"/)
    expect(source).not.toMatch(/pgTable\(\s*"sessions"/)
    expect(source).not.toMatch(/pgTable\(\s*"learners"/)
    for (const name of ["goals", "learningPaths", "learningPathSteps", "evidence"]) {
      const block = tableBlock(source, name)
      expect(block, name).not.toMatch(/user_id/)
      expect(block, name).not.toMatch(/learner_id/)
      expect(block, name).not.toMatch(/organization_id/)
    }
    expect(source).not.toMatch(/todo/)
    expect(source).not.toMatch(/mastery/i)
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

  it("does not persist Learner or Session in the identity module", () => {
    const identityDir = join(modulesDir, "identity")
    for (const file of listSourceFiles(identityDir)) {
      const source = readFileSync(file, "utf8")
      expect(source, file).not.toMatch(/\bsession\b/i)
      expect(source, file).not.toMatch(/createLearner/)
    }
  })
})
