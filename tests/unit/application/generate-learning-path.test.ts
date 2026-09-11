import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  generateLearningPath,
  type PathGenerator,
  type PathGeneratorInput,
} from "../../../src/application/generate-learning-path.js"

const INPUT: PathGeneratorInput = {
  goal: "Maîtriser Outlook",
  level: "debutant",
  hoursPerWeek: 5,
  intent: "professionnel",
}

const PROPOSAL = {
  pathId: "fake-path",
  pathTitle: "Fake GPS",
  steps: [{ id: "s1", title: "Step 1" }],
  summary: "fake",
}

describe("application — generateLearningPath", () => {
  it("calls the injected generator with the expected input and returns its proposal", async () => {
    const calls: PathGeneratorInput[] = []
    const pathGenerator: PathGenerator = {
      async generatePath(input) {
        calls.push(input)
        return PROPOSAL
      },
    }

    const result = await generateLearningPath(INPUT, pathGenerator)

    expect(calls).toEqual([INPUT])
    expect(result).toEqual(PROPOSAL)
  })

  it("propagates generator failure", async () => {
    const pathGenerator: PathGenerator = {
      async generatePath() {
        throw new Error("generator-failed")
      },
    }

    await expect(generateLearningPath(INPUT, pathGenerator)).rejects.toThrow("generator-failed")
  })

  it("does not reimplement Goal-before-Path (I-01 stays in store.setPath)", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/generate-learning-path.ts"),
      "utf8",
    )
    expect(source).not.toMatch(/assertGoalReadyForPath/)
    expect(source).not.toMatch(/confirmGoal/)
  })
})
