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
    }
  })

  it("always registers auth routes and requires injected auth deps", () => {
    const source = readFileSync(join(serverDir, "app.ts"), "utf8")
    expect(source).toMatch(/auth: LoginDependencies/)
    expect(source).toMatch(/await registerAuthRoutes\(app, opts\.auth\)/)
    expect(source).toMatch(/await registerOrganizationRoutes\(app, opts\.auth\)/)
    expect(source).not.toMatch(/if \(opts\?\.auth\)/)
    expect(source).not.toMatch(/from ["'].*infra\/db/)
  })
})
