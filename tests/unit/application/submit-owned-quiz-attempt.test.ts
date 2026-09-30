import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it, vi } from "vitest"
import { submitOwnedQuizAttempt } from "../../../src/application/submit-owned-quiz-attempt.js"
import { persistOwnedEvidence } from "../../../src/application/persist-owned-evidence.js"
import { ownedQuizFixture, selections, declared } from "../../helpers/owned-quiz.js"

const input = { goalId: "goal-a", stepId: "step-a", selections }
function submit(f: ReturnType<typeof ownedQuizFixture>, data = input) {
  return submitOwnedQuizAttempt(data, f.context, f.ownedDerived, f.ownedQuizzes, f.ownedEvidence,
    { now: "2026-09-30T00:00:00.000Z" })
}
describe("application â€” trusted quiz submission", () => {
  it("derives score only from the key, stamps server fields and persists once through trusted write", async () => {
    const f = ownedQuizFixture()
    const forged = { ...input, score: 999, passed: false, id: "forged", scoringProvenance: "client_declared" }
    const saved = await submit(f, forged)
    expect(saved).toMatchObject({ score: 2, maxScore: 2, passed: true, answers: declared.answers,
      scoringProvenance: "server_recalculated", recordedAt: "2026-09-30T00:00:00.000Z" })
    expect(saved.id).not.toBe("forged")
    expect(f.ownedEvidence.saveOwnedServerRecalculated).toHaveBeenCalledTimes(1)
    expect(f.ownedEvidence.saveOwned).not.toHaveBeenCalled()
    expect(f.ownedQuizzes.saveOwned).not.toHaveBeenCalled()
  })
  it("rejects an inaccessible Step before key lookup", async () => {
    const f = ownedQuizFixture()
    await expect(submit(f, { ...input, goalId: "other" })).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" })
    expect(f.ownedQuizzes.getOwned).not.toHaveBeenCalled()
    expect(f.ownedEvidence.records).toEqual([])
  })
  it("rejects missing or invalid keys and invalid coverage without writing", async () => {
    const f = ownedQuizFixture()
    await expect(submit(f, { ...input, selections: [] })).rejects.toMatchObject({ code: "QUIZ_SELECTION_INVALID" })
    f.keys.set("step-a", { minimumCorrectCount: 1, items: [] })
    await expect(submit(f)).rejects.toMatchObject({ code: "QUIZ_DEFINITION_INVALID" })
    f.keys.delete("step-a")
    await expect(submit(f)).rejects.toMatchObject({ code: "QUIZ_DEFINITION_REQUIRED" })
    expect(f.ownedEvidence.records).toEqual([])
  })
  it("fails closed when key lookup fails on either write path", async () => {
    const f = ownedQuizFixture()
    vi.mocked(f.ownedQuizzes.getOwned).mockRejectedValue(new Error("key storage unavailable"))
    await expect(submit(f)).rejects.toThrow("key storage unavailable")
    await expect(persistOwnedEvidence({ ...input, ...declared }, f.context, f.ownedDerived,
      f.ownedEvidence, f.ownedQuizzes)).rejects.toThrow("key storage unavailable")
    expect(f.ownedEvidence.records).toEqual([])
  })
  it("blocks the keyed legacy use case before recording Evidence", async () => {
    const f = ownedQuizFixture()
    await expect(persistOwnedEvidence({ ...input, ...declared }, f.context, f.ownedDerived,
      f.ownedEvidence, f.ownedQuizzes)).rejects.toMatchObject({ code: "QUIZ_TRUSTED_SUBMISSION_REQUIRED" })
    expect(f.ownedEvidence.records).toEqual([])
  })
  it("has no Skill attribution, Mastery, adaptive or Progress write dependency", () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/submit-owned-quiz-attempt.ts"), "utf8")
    expect(source).not.toMatch(/bindOwned|[Mm]astery|[Aa]dapt|[Pp]rogress|[Ss]killRepository|[Ee]videnceSkill/)
    expect(source).not.toMatch(/getById|infra\/|server\//)
  })
})
