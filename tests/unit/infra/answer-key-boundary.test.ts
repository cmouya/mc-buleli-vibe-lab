import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..")

function source(path: string): string {
  return readFileSync(join(root, path), "utf8")
}

const learnerReads = [
  "src/modules/learning-path/accepted-path.ts",
  "src/infra/db/owned-derived-content-repository.ts",
  "src/infra/db/owned-learning-path-repository.ts",
  "src/infra/db/learning-path-repository.ts",
  "src/infra/db/goal-repository.ts",
  "src/infra/db/owned-progress-repository.ts",
]

describe("slice 2 — answer key stays off learner reads", () => {
  it("keeps AcceptedPathStep free of quiz items and correctIndex", () => {
    const step = source("src/modules/learning-path/accepted-path.ts")
    expect(step).not.toMatch(/correctIndex/)
    expect(step).not.toMatch(/items/)
    expect(step).not.toMatch(/step_quiz_definitions/)
  })

  it("does not join step_quiz_definitions into ordinary Step, Path, Goal, or Progress reads", () => {
    for (const path of learnerReads) {
      const text = source(path)
      expect(text, path).not.toMatch(/step_quiz_definitions/)
      expect(text, path).not.toMatch(/stepQuizDefinitions/)
    }
  })

  it("has no stepId-only authoritative quiz method and no quiz-attempts route", () => {
    const port = source("src/modules/evidence/owned-step-quiz-repository.ts")
    expect(port).toMatch(/goalId: string/)
    expect(port).toMatch(/scope: GoalOwnerScope/)
    expect(port).not.toMatch(/getByStepId/)
    const routes = source("src/server/routes/v1/organizations.ts")
    expect(routes).not.toMatch(/quiz-attempts/)
    expect(routes).not.toMatch(/saveOwnedServerRecalculated/)
    expect(routes).not.toMatch(/stepQuizDefinitions/)
  })
})
