import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { persistOwnedEvidence } from "../../../src/application/persist-owned-evidence.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import { DomainError } from "../../../src/modules/shared/index.js"
import type { Evidence } from "../../../src/modules/evidence/index.js"
import type { OwnedEvidenceRepository } from "../../../src/modules/evidence/index.js"
import type {
  AcceptedPathStep,
  OwnedDerivedContentRepository,
} from "../../../src/modules/learning-path/index.js"

const NOW = "2026-09-19T20:00:00.000Z"
const GOAL_A = "11111111-1111-4111-8111-111111111111"
const GOAL_B = "22222222-2222-4222-8222-222222222222"
const STEP_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const STEP_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const STEP_LEGACY = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"

const answers = [
  { questionIndex: 0, selectedIndex: 1, correct: true },
  { questionIndex: 1, selectedIndex: 0, correct: false },
]

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function contextB(): LearnerContext {
  return { learnerId: "lrn-b", userId: "user-u", organizationId: "org-b" }
}

function contextA2(): LearnerContext {
  return { learnerId: "lrn-a2", userId: "user-2", organizationId: "org-a" }
}

function payload(overrides: Record<string, unknown> = {}) {
  return {
    goalId: GOAL_A,
    stepId: STEP_A,
    score: 1,
    maxScore: 2,
    passed: false,
    answers,
    ...overrides,
  }
}

function step(id: string, title = "Quiz"): AcceptedPathStep {
  return { id, position: 0, title, description: "" }
}

type SeededStep = {
  step: AcceptedPathStep
  goalId: string
  organizationId?: string
  learnerId?: string
}

function memoryDerived(seed: SeededStep[] = []): OwnedDerivedContentRepository {
  return {
    async getOwnedPathByGoalId() {
      return null
    },
    async getOwnedStepById(stepId, goalId, scope) {
      const row = seed.find(
        (item) =>
          item.step.id === stepId &&
          item.goalId === goalId &&
          item.organizationId === scope.organizationId &&
          item.learnerId === scope.learnerId,
      )
      return row?.step ?? null
    },
    async getOwnedEvidenceById() {
      return null
    },
  }
}

function memoryOwnedEvidence(): OwnedEvidenceRepository & {
  records: Evidence[]
  lastScope: { organizationId: string; learnerId: string } | null
  lastGoalId: string | null
} {
  const records: Evidence[] = []
  return {
    records,
    lastScope: null,
    lastGoalId: null,
    async saveOwned(item, scope, goalId) {
      this.lastScope = { organizationId: scope.organizationId, learnerId: scope.learnerId }
      this.lastGoalId = goalId
      records.push(item)
      return item
    },
  }
}

describe("application — persistOwnedEvidence", () => {
  it("persists scored Evidence under an accessible owned Step", async () => {
    const derived = memoryDerived([
      { step: step(STEP_A), goalId: GOAL_A, organizationId: "org-a", learnerId: "lrn-a" },
    ])
    const owned = memoryOwnedEvidence()
    const saved = await persistOwnedEvidence(payload(), contextA(), derived, owned, { now: NOW })
    expect(saved.stepId).toBe(STEP_A)
    expect(saved.type).toBe("quiz_attempt")
    expect(saved.score).toBe(1)
    expect(saved.maxScore).toBe(2)
    expect(saved.passed).toBe(false)
    expect(saved.answers).toEqual(answers)
    expect(saved.recordedAt).toBe(NOW)
    expect(saved.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
    expect(owned.records).toHaveLength(1)
    expect(owned.lastScope).toEqual({ organizationId: "org-a", learnerId: "lrn-a" })
    expect(owned.lastGoalId).toBe(GOAL_A)
  })

  it("stamps stepId from the authorized Step and ignores forged ownership fields", async () => {
    const derived = memoryDerived([
      { step: step(STEP_A), goalId: GOAL_A, organizationId: "org-a", learnerId: "lrn-a" },
    ])
    const owned = memoryOwnedEvidence()
    const saved = await persistOwnedEvidence(
      payload({
        organizationId: "org-forged",
        learnerId: "lrn-forged",
        goalId: GOAL_A,
        stepId: STEP_A,
        type: "submission",
        id: "forged-id",
        recordedAt: "1999-01-01T00:00:00.000Z",
      }),
      contextA(),
      derived,
      owned,
      { now: NOW },
    )
    expect(saved.stepId).toBe(STEP_A)
    expect(saved.type).toBe("quiz_attempt")
    expect(saved.id).not.toBe("forged-id")
    expect(saved.recordedAt).toBe(NOW)
    expect(owned.lastScope).toEqual({ organizationId: "org-a", learnerId: "lrn-a" })
    expect(owned.lastGoalId).toBe(GOAL_A)
    expect(owned.lastScope?.organizationId).not.toBe("org-forged")
    expect(owned.lastScope?.learnerId).not.toBe("lrn-forged")
  })

  it("does not persist for unknown Step with the same failure as inaccessible", async () => {
    const owned = memoryOwnedEvidence()
    const unknown = persistOwnedEvidence(
      payload({ stepId: "00000000-0000-4000-8000-000000000000" }),
      contextA(),
      memoryDerived(),
      owned,
    )
    const otherOrg = persistOwnedEvidence(
      payload({ stepId: STEP_B, goalId: GOAL_B }),
      contextA(),
      memoryDerived([
        { step: step(STEP_B), goalId: GOAL_B, organizationId: "org-b", learnerId: "lrn-b" },
      ]),
      owned,
    )
    await expect(unknown).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      message: "Not found",
    })
    await expect(otherOrg).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      message: "Not found",
    })
    expect(owned.records).toHaveLength(0)
  })

  it("cannot persist across organization or wrong Learner", async () => {
    const derived = memoryDerived([
      { step: step(STEP_A), goalId: GOAL_A, organizationId: "org-a", learnerId: "lrn-a" },
    ])
    const owned = memoryOwnedEvidence()
    await expect(
      persistOwnedEvidence(payload(), contextB(), derived, owned),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    await expect(
      persistOwnedEvidence(payload(), contextA2(), derived, owned),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(owned.records).toHaveLength(0)
  })

  it("fails closed when the Step belongs to another Goal", async () => {
    const derived = memoryDerived([
      { step: step(STEP_A), goalId: GOAL_A, organizationId: "org-a", learnerId: "lrn-a" },
    ])
    const owned = memoryOwnedEvidence()
    await expect(
      persistOwnedEvidence(payload({ goalId: GOAL_B }), contextA(), derived, owned),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(owned.records).toHaveLength(0)
  })

  it("does not treat unowned legacy Goal chains as owned", async () => {
    const derived = memoryDerived([
      { step: step(STEP_LEGACY), goalId: GOAL_A },
    ])
    const owned = memoryOwnedEvidence()
    await expect(
      persistOwnedEvidence(payload({ stepId: STEP_LEGACY }), contextA(), derived, owned),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(owned.records).toHaveLength(0)
  })

  it("forged body goalId/stepId cannot override the trusted requested identifiers", async () => {
    const derived = memoryDerived([
      { step: step(STEP_A), goalId: GOAL_A, organizationId: "org-a", learnerId: "lrn-a" },
      { step: step(STEP_B), goalId: GOAL_B, organizationId: "org-a", learnerId: "lrn-a" },
    ])
    const owned = memoryOwnedEvidence()
    const saved = await persistOwnedEvidence(
      payload({
        goalId: GOAL_A,
        stepId: STEP_A,
        extraGoalId: GOAL_B,
        extraStepId: STEP_B,
      }),
      contextA(),
      derived,
      owned,
      { now: NOW },
    )
    expect(saved.stepId).toBe(STEP_A)
    expect(owned.lastGoalId).toBe(GOAL_A)
    expect(owned.lastGoalId).not.toBe(GOAL_B)
  })

  it("authorizes through getOwnedStep and has no global getById or submitAndPersistEvidence", async () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../src/application/persist-owned-evidence.ts",
      ),
      "utf8",
    )
    expect(source).toMatch(/getOwnedStep/)
    expect(source).toMatch(/saveOwned/)
    expect(source).not.toMatch(/submitAndPersistEvidence/)
    expect(source).not.toMatch(/\.getById\(/)
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/postgres/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
