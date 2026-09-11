import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const applicationDir = join(dirname(fileURLToPath(import.meta.url)), "../../../src/application")

describe("application — layer boundary", () => {
  it("does not import store, views, or localStorage", () => {
    const files = ["confirm-goal.ts", "submit-assessment.ts", "index.ts"]
    for (const file of files) {
      const source = readFileSync(join(applicationDir, file), "utf8")
      expect(source).not.toMatch(/store\.js/)
      expect(source).not.toMatch(/views\//)
      expect(source).not.toMatch(/localStorage/)
    }
  })
})
