import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import type { Evidence } from "../../../src/modules/evidence/index.js"
import type { EvidenceRepository } from "../../../src/modules/evidence/index.js"
import { submitAndPersistEvidence } from "../../../src/application/persist-evidence.js"

const FAIL_DETAILS = [
  { index: 0, selected: 0, correct: false },
  { index: 1, selected: 0, correct: false },
  { index: 2, selected: 0, correct: false },
]

const PASS_DETAILS = [
  { index: 0, selected: 1, correct: true },
  { index: 1, selected: 1, correct: true },
  { index: 2, selected: 0, correct: false },
]

const STEP_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"

function memoryEvidenceRepository(): EvidenceRepository & { records: Evidence[] } {
  const records: Evidence[] = []
  return {
    records,
    async save(item) {
      if (!item.id) {
        throw new Error("id required")
      }
      records.push(item)
      return item
    },
    async getById(id) {
      return records.find((item) => item.id === id) ?? null
    },
    async getByStepId(stepId) {
      return records.filter((item) => item.stepId === stepId)
    },
  }
}

describe("application — submitAndPersistEvidence", () => {
  it("persists a failed attempt without treating it as completion", async () => {
    const repo = memoryEvidenceRepository()
    const result = await submitAndPersistEvidence(
      {
        stepId: STEP_ID,
        score: 0,
        total: 3,
        passed: false,
        details: FAIL_DETAILS,
      },
      repo,
    )
    expect(result.completionAllowed).toBe(false)
    expect(result.evidence.passed).toBe(false)
    expect(result.evidence.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(repo.records).toHaveLength(1)
  })

  it("persists a passed attempt without writing progress", async () => {
    const repo = memoryEvidenceRepository()
    const result = await submitAndPersistEvidence(
      {
        stepId: STEP_ID,
        score: 2,
        total: 3,
        passed: true,
        details: PASS_DETAILS,
      },
      repo,
    )
    expect(result.completionAllowed).toBe(true)
    expect(result.evidence.passed).toBe(true)
    expect(JSON.stringify(result)).not.toMatch(/todo|current|done/)
  })

  it("keeps submitAssessment free of persistence and does not reimplement I-05", () => {
    const persistSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/persist-evidence.ts"),
      "utf8",
    )
    const submitSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/submit-assessment.ts"),
      "utf8",
    )
    expect(persistSource).toMatch(/submitAssessment/)
    expect(persistSource).not.toMatch(/assertEvidenceAllowsCompletion/)
    expect(persistSource).not.toMatch(/applyStepCompletion/)
    expect(submitSource).not.toMatch(/EvidenceRepository/)
    expect(submitSource).not.toMatch(/drizzle/)
  })
})
