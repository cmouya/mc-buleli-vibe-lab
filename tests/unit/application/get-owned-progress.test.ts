import { describe, expect, it } from "vitest"
import {
  getOwnedPathProgress,
  getOwnedStepCompletion,
} from "../../../src/application/get-owned-progress.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import { DomainError } from "../../../src/modules/shared/index.js"
import type { Evidence } from "../../../src/modules/evidence/index.js"
import type { OwnedProgressRepository } from "../../../src/modules/evidence/index.js"
import type {
  AcceptedLearningPath,
  AcceptedPathStep,
  OwnedDerivedContentRepository,
} from "../../../src/modules/learning-path/index.js"

const GOAL_A = "11111111-1111-4111-8111-111111111111"
const GOAL_B = "22222222-2222-4222-8222-222222222222"
const PATH_A = "p1111111-1111-4111-8111-111111111111"
const STEP_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const STEP_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const STEP_C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function contextB(): LearnerContext {
  return { learnerId: "lrn-b", userId: "user-u", organizationId: "org-b" }
}

function contextA2(): LearnerContext {
  return { learnerId: "lrn-a2", userId: "user-2", organizationId: "org-a" }
}

function step(id: string, position = 0): AcceptedPathStep {
  return { id, position, title: `Step ${id.slice(0, 4)}`, description: "" }
}

function path(steps: AcceptedPathStep[], goalId = GOAL_A): AcceptedLearningPath {
  return { id: PATH_A, goalId, title: "Path", steps }
}

function evidence(stepId: string, passed: boolean, id = `ev-${stepId}-${passed}`): Evidence {
  return {
    id,
    stepId,
    type: "quiz_attempt",
    score: passed ? 1 : 0,
    maxScore: 1,
    passed,
    answers: [],
    recordedAt: "2026-09-19T22:00:00.000Z",
  }
}

type Seed = {
  path?: AcceptedLearningPath | null
  organizationId?: string
  learnerId?: string
  steps?: Array<{ step: AcceptedPathStep; goalId: string; organizationId: string; learnerId: string }>
  evidence?: Array<{
    item: Evidence
    goalId: string
    organizationId: string
    learnerId: string
  }>
}

function memoryDerived(seed: Seed = {}): OwnedDerivedContentRepository {
  return {
    async getOwnedPathByGoalId(goalId, scope) {
      const owned = seed.path
      if (!owned || owned.goalId !== goalId) {
        return null
      }
      if (seed.organizationId !== scope.organizationId || seed.learnerId !== scope.learnerId) {
        return null
      }
      return owned
    },
    async getOwnedStepById(stepId, goalId, scope) {
      const row = seed.steps?.find(
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

function memoryProgress(seed: Seed = {}): OwnedProgressRepository & {
  calls: Array<{ stepId: string; goalId: string; organizationId: string; learnerId: string }>
  writes: number
} {
  const evidenceSeed = seed.evidence ?? []
  const calls: Array<{
    stepId: string
    goalId: string
    organizationId: string
    learnerId: string
  }> = []
  return {
    calls,
    writes: 0,
    async listOwnedEvidenceForStep(stepId, goalId, scope) {
      calls.push({
        stepId,
        goalId,
        organizationId: scope.organizationId,
        learnerId: scope.learnerId,
      })
      return evidenceSeed
        .filter(
          (row) =>
            row.item.stepId === stepId &&
            row.goalId === goalId &&
            row.organizationId === scope.organizationId &&
            row.learnerId === scope.learnerId,
        )
        .map((row) => row.item)
    },
  }
}

function ownedSeed(steps: AcceptedPathStep[], evidenceRows: Evidence[] = []): Seed {
  return {
    path: path(steps),
    organizationId: "org-a",
    learnerId: "lrn-a",
    steps: steps.map((item) => ({
      step: item,
      goalId: GOAL_A,
      organizationId: "org-a",
      learnerId: "lrn-a",
    })),
    evidence: evidenceRows.map((item) => ({
      item,
      goalId: GOAL_A,
      organizationId: "org-a",
      learnerId: "lrn-a",
    })),
  }
}

describe("application — getOwnedPathProgress / getOwnedStepCompletion", () => {
  it("returns zero-step Path progress as 0 / 0 / 0", async () => {
    const seed = ownedSeed([])
    const progress = memoryProgress(seed)
    const result = await getOwnedPathProgress(GOAL_A, contextA(), memoryDerived(seed), progress)
    expect(result).toEqual({ totalSteps: 0, completedSteps: 0, progressPercent: 0 })
    expect(progress.writes).toBe(0)
  })

  it("treats one Step with no Evidence as incomplete", async () => {
    const seed = ownedSeed([step(STEP_A)])
    const progress = memoryProgress(seed)
    const pathResult = await getOwnedPathProgress(GOAL_A, contextA(), memoryDerived(seed), progress)
    const stepResult = await getOwnedStepCompletion(
      STEP_A,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      progress,
    )
    expect(pathResult).toEqual({ totalSteps: 1, completedSteps: 0, progressPercent: 0 })
    expect(stepResult).toEqual({ stepId: STEP_A, complete: false })
  })

  it("treats failed-only Evidence as incomplete", async () => {
    const seed = ownedSeed([step(STEP_A)], [evidence(STEP_A, false)])
    const result = await getOwnedStepCompletion(
      STEP_A,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    expect(result.complete).toBe(false)
  })

  it("completes after failed then passed Evidence", async () => {
    const seed = ownedSeed(
      [step(STEP_A)],
      [evidence(STEP_A, false, "fail"), evidence(STEP_A, true, "pass")],
    )
    const result = await getOwnedStepCompletion(
      STEP_A,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    expect(result.complete).toBe(true)
  })

  it("remains complete after passed then failed Evidence", async () => {
    const seed = ownedSeed(
      [step(STEP_A)],
      [evidence(STEP_A, true, "pass"), evidence(STEP_A, false, "fail")],
    )
    const result = await getOwnedStepCompletion(
      STEP_A,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    expect(result.complete).toBe(true)
  })

  it("counts one Step for multiple passed Evidence rows", async () => {
    const seed = ownedSeed(
      [step(STEP_A)],
      [evidence(STEP_A, true, "p1"), evidence(STEP_A, true, "p2")],
    )
    const result = await getOwnedPathProgress(
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    expect(result).toEqual({ totalSteps: 1, completedSteps: 1, progressPercent: 100 })
  })

  it("derives mixed Path totals and rounded percent", async () => {
    const seed = ownedSeed(
      [step(STEP_A, 0), step(STEP_B, 1), step(STEP_C, 2)],
      [evidence(STEP_A, true), evidence(STEP_B, false)],
    )
    const result = await getOwnedPathProgress(
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    expect(result.totalSteps).toBe(3)
    expect(result.completedSteps).toBe(1)
    expect(result.progressPercent).toBe(33)
  })

  it("does not complete a Step from Evidence belonging to another Step", async () => {
    const seed = ownedSeed([step(STEP_A), step(STEP_B)], [evidence(STEP_B, true)])
    const a = await getOwnedStepCompletion(
      STEP_A,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    const b = await getOwnedStepCompletion(
      STEP_B,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      memoryProgress(seed),
    )
    expect(a.complete).toBe(false)
    expect(b.complete).toBe(true)
  })

  it("preserves I-05 Step identity even if passed Evidence claims another stepId", async () => {
    const forged: Evidence = {
      ...evidence(STEP_B, true, "forged"),
      stepId: STEP_B,
    }
    const seed = ownedSeed([step(STEP_A)], [forged])
    const result = await getOwnedStepCompletion(
      STEP_A,
      GOAL_A,
      contextA(),
      memoryDerived(seed),
      {
        async listOwnedEvidenceForStep() {
          return [forged]
        },
      },
    )
    expect(result.complete).toBe(false)
  })

  it("does not mutate repositories while deriving Progress", async () => {
    const seed = ownedSeed([step(STEP_A)], [evidence(STEP_A, true)])
    const progress = memoryProgress(seed)
    await getOwnedPathProgress(GOAL_A, contextA(), memoryDerived(seed), progress)
    expect(progress.writes).toBe(0)
  })

  it("uses trusted LearnerContext, not client tenant identifiers", async () => {
    const seed = ownedSeed([step(STEP_A)], [evidence(STEP_A, true)])
    const progress = memoryProgress(seed)
    const forged = {
      ...contextA(),
      learnerId: "forged-learner",
      organizationId: "forged-org",
    }
    await getOwnedPathProgress(GOAL_A, contextA(), memoryDerived(seed), progress)
    expect(progress.calls[0]).toEqual({
      stepId: STEP_A,
      goalId: GOAL_A,
      organizationId: "org-a",
      learnerId: "lrn-a",
    })
    expect(progress.calls[0]?.learnerId).not.toBe(forged.learnerId)
  })

  it("denies inaccessible Goal/Path with generic RESOURCE_NOT_FOUND", async () => {
    const seed = ownedSeed([step(STEP_A)], [evidence(STEP_A, true)])
    const derived = memoryDerived(seed)
    const progress = memoryProgress(seed)
    await expect(getOwnedPathProgress(GOAL_B, contextA(), derived, progress)).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
      message: "Not found",
    })
    await expect(
      getOwnedPathProgress(GOAL_A, contextB(), derived, progress),
    ).rejects.toBeInstanceOf(DomainError)
    await expect(
      getOwnedStepCompletion(STEP_A, GOAL_A, contextA2(), derived, progress),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    expect(JSON.stringify({ code: "RESOURCE_NOT_FOUND", message: "Not found" })).not.toMatch(
      /organizationId|learnerId/,
    )
  })
})
