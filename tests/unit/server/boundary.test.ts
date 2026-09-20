import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const serverDir = join(dirname(fileURLToPath(import.meta.url)), "../../../src/server")

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

describe("server — layer boundary", () => {
  it("does not import views, store, localStorage, DOM, or MockAIService", () => {
    const files = listSourceFiles(serverDir)
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const source = readFileSync(file, "utf8")
      expect(source, file).not.toMatch(/views\//)
      expect(source, file).not.toMatch(/store\.js/)
      expect(source, file).not.toMatch(/localStorage/)
      expect(source, file).not.toMatch(/\bdocument\b/)
      expect(source, file).not.toMatch(/MockAIService/)
      expect(source, file).not.toMatch(/drizzle-orm/)
      expect(source, file).not.toMatch(/drizzle-kit/)
      expect(source, file).not.toMatch(/from ["']postgres["']/)
    }
  })

  it("always registers auth routes and requires injected auth deps", () => {
    const source = readFileSync(join(serverDir, "app.ts"), "utf8")
    expect(source).toMatch(/auth: LoginDependencies/)
    expect(source).toMatch(/learners: LearnerRepository/)
    expect(source).toMatch(/ownedGoals: OwnedGoalRepository/)
    expect(source).toMatch(/ownedDerived: OwnedDerivedContentRepository/)
    expect(source).toMatch(/ownedPaths: OwnedLearningPathRepository/)
    expect(source).toMatch(/ownedEvidence: OwnedEvidenceRepository/)
    expect(source).toMatch(/ownedProgress: OwnedProgressRepository/)
    expect(source).toMatch(/await registerAuthRoutes\(app, opts\.auth\)/)
    expect(source).toMatch(/ownedGoals: opts\.ownedGoals/)
    expect(source).toMatch(/ownedDerived: opts\.ownedDerived/)
    expect(source).toMatch(/ownedPaths: opts\.ownedPaths/)
    expect(source).toMatch(/ownedEvidence: opts\.ownedEvidence/)
    expect(source).toMatch(/ownedProgress: opts\.ownedProgress/)
    expect(source).not.toMatch(/if \(opts\?\.auth\)/)
    expect(source).not.toMatch(/from ["'].*infra\/db/)
    const orgRoutes = readFileSync(join(serverDir, "routes/v1/organizations.ts"), "utf8")
    expect(orgRoutes).toMatch(/persistOwnedGoal/)
    expect(orgRoutes).toMatch(/getOwnedGoal/)
    expect(orgRoutes).toMatch(/getOwnedPath/)
    expect(orgRoutes).toMatch(/persistOwnedPath/)
    expect(orgRoutes).toMatch(/persistOwnedEvidence/)
    expect(orgRoutes).toMatch(/getOwnedPathProgress/)
    expect(orgRoutes).toMatch(/getOwnedStep/)
    expect(orgRoutes).toMatch(/getOwnedEvidence/)
    expect(orgRoutes).not.toMatch(/getById\(/)
    expect(orgRoutes).not.toMatch(/getByStepId/)
    expect(orgRoutes).not.toMatch(/listOwnedEvidenceForStep/)
    expect(orgRoutes).not.toMatch(/assertEvidenceAllowsCompletion/)
    expect(orgRoutes).not.toMatch(/drizzle-orm/)
    expect(orgRoutes).not.toMatch(/from ["']postgres["']/)
    expect(orgRoutes).not.toMatch(/from ["'].*infra\/db/)
  })
})
