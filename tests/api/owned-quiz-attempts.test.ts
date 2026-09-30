import { afterEach, describe, expect, it } from "vitest"
import { buildApp } from "../../src/server/app.js"
import { AUTH_COOKIE_NAME } from "../../src/server/auth-cookie.js"
import { ownedQuizFixture, selections, declared, quiz } from "../helpers/owned-quiz.js"

const base = "/api/v1/organizations/org-a/goals/goal-a"
const trustedUrl = `${base}/steps/step-a/quiz-attempts`
const headers: Record<string, string> = { cookie: `${AUTH_COOKIE_NAME}=owner`, "content-type": "application/json" }
const apps: Awaited<ReturnType<typeof buildApp>>[] = []
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())) })
async function setup() {
  const fixture = ownedQuizFixture()
  const app = await buildApp(fixture.options)
  apps.push(app)
  const submit = (payload: unknown, url = trustedUrl, requestHeaders = headers) => app.inject({
    method: "POST", url, headers: requestHeaders, payload: JSON.stringify(payload),
    // Send JSON explicitly so malformed JSON shapes exercise the same HTTP parser.
  })
  return { ...fixture, app, submit }
}

function expectSafe(body: Record<string, unknown>) {
  expect(Object.keys(body).sort()).toEqual([
    "answers", "id", "maxScore", "passed", "recordedAt", "score", "scoringProvenance", "stepId", "type",
  ].sort())
  expect(JSON.stringify(body)).not.toMatch(/"correct"|correctIndex|minimumCorrectCount|secret-|"items"|explanation/)
  for (const answer of body.answers as Record<string, unknown>[]) {
    expect(Object.keys(answer).sort()).toEqual(["questionIndex", "selectedIndex"])
  }
}

describe("API — owned trusted quiz attempts", () => {
  it("server-scores, persists trusted provenance, sanitizes POST and GET, and preserves retry Progress", async () => {
    const f = await setup()
    const progress = async () => (await f.app.inject({ method: "GET", url: `${base}/path/progress`, headers })).json()
    expect((await progress()).completedSteps).toBe(0)
    const failed = await f.submit({ selections: selections.map((s) => ({ ...s, selectedIndex: 1 - s.selectedIndex })) })
    expect(failed.statusCode).toBe(200)
    expect(failed.json()).toMatchObject({ score: 0, maxScore: 2, passed: false, scoringProvenance: "server_recalculated" })
    expectSafe(failed.json())
    expect((await progress()).completedSteps).toBe(0)
    const passed = await f.submit({ selections })
    expect(passed.statusCode).toBe(200)
    expect(passed.json()).toMatchObject({ score: 2, maxScore: 2, passed: true, scoringProvenance: "server_recalculated" })
    expectSafe(passed.json())
    expect(f.ownedEvidence.records[1]?.answers).toEqual(declared.answers)
    expect(f.ownedEvidence.lastScope).toEqual({ organizationId: "org-a", learnerId: "learner-a" })
    expect(f.ownedEvidence.lastGoalId).toBe("goal-a")
    expect(f.ownedEvidence.saveOwned).not.toHaveBeenCalled()
    expect(f.ownedQuizzes.saveOwned).not.toHaveBeenCalled()
    for (const record of f.ownedEvidence.records) {
      const read = await f.app.inject({ method: "GET", url: `${base}/evidence/${record.id}`, headers })
      expect(read.statusCode).toBe(200)
      expectSafe(read.json())
      expect(read.json().answers).toEqual(record.answers.map(({ questionIndex, selectedIndex }) => ({ questionIndex, selectedIndex })))
    }
    expect(await progress()).toEqual({ totalSteps: 2, completedSteps: 1, progressPercent: 50 })
    await f.submit({ selections: selections.map((s) => ({ ...s, selectedIndex: 1 - s.selectedIndex })) })
    expect(await progress()).toEqual({ totalSteps: 2, completedSteps: 1, progressPercent: 50 })
    expect(f.ownedEvidence.records).toHaveLength(3)
  })

  const authorityFields = ["score", "total", "maxScore", "passed", "threshold", "minimumCorrectCount", "correct",
    "correctness", "correctIndex", "items", "answerKey", "answers", "provenance", "scoringProvenance",
    "trusted", "server_recalculated", "organizationId", "learnerId", "goalId", "stepId", "id", "recordedAt", "extra"]
  it.each(authorityFields)("rejects forged %s at top level and inside selections, without writes", async (field) => {
    const f = await setup()
    for (const payload of [
      { selections, [field]: field === "score" ? 100 : true },
      { selections: selections.map((s) => ({ ...s, [field]: "server_recalculated" })) },
    ]) {
      const response = await f.submit(payload)
      expect(response.statusCode).toBe(400)
      expect(response.json().code).toBe("QUIZ_SELECTION_INVALID")
      expect(f.ownedEvidence.records).toHaveLength(0)
    }
    expect(f.ownedQuizzes.getOwned).not.toHaveBeenCalled()
    const progress = await f.app.inject({ method: "GET", url: `${base}/path/progress`, headers })
    expect(progress.json().completedSteps).toBe(0)
  })

  const invalidBodies = [
    {}, null, [], 1, "selections", { selections: null }, { selections: {} },
    { selections: [] }, { selections: [null] }, { selections: [[0, 1]] },
    { selections: [{ questionIndex: 0 }] }, { selections: [{ selectedIndex: 0 }] },
    { selections: [selections[0]] },
    { selections: [selections[0], selections[0]] },
    ...["0", true, null, [], {}, -1, 0.5, 2].flatMap((value) => [
      { selections: [{ questionIndex: value, selectedIndex: 1 }, selections[1]] },
      { selections: [{ questionIndex: 0, selectedIndex: value }, selections[1]] },
    ]),
  ]
  it.each(invalidBodies.map((body, index) => ({ body, index })))("rejects malformed selection case $index without persistence", async ({ body }) => {
    const f = await setup()
    expect((await f.submit(body)).statusCode).toBe(400)
    expect(f.ownedEvidence.records).toHaveLength(0)
    expect(f.ownedEvidence.saveOwnedServerRecalculated).not.toHaveBeenCalled()
  })

  it("rejects keyed legacy writes, retains unkeyed legacy and historical declared rows", async () => {
    const f = await setup()
    const rejected = await f.submit(declared, `${base}/steps/step-a/evidence`)
    expect(rejected.statusCode).toBe(400)
    expect(rejected.json().code).toBe("QUIZ_TRUSTED_SUBMISSION_REQUIRED")
    expect(f.ownedEvidence.records).toHaveLength(0)
    const progress = () => f.app.inject({ method: "GET", url: `${base}/path/progress`, headers })
    expect((await progress()).json().completedSteps).toBe(0)
    const missingKey = await f.submit({ selections }, `${base}/steps/step-b/quiz-attempts`)
    expect(missingKey.statusCode).toBe(400)
    expect(missingKey.json().code).toBe("QUIZ_DEFINITION_REQUIRED")
    expect(f.ownedEvidence.records).toHaveLength(0)
    const legacy = await f.submit(declared, `${base}/steps/step-b/evidence`)
    expect(legacy.statusCode).toBe(200)
    expect(legacy.json()).toMatchObject({ ...declared, scoringProvenance: "client_declared" })
    const historical = structuredClone(f.ownedEvidence.records)
    f.keys.set("step-b", quiz)
    expect((await f.submit(declared, `${base}/steps/step-b/evidence`)).statusCode).toBe(400)
    expect(f.ownedEvidence.records).toEqual(historical)
    expect((await progress()).json().completedSteps).toBe(1)
    const get = await f.app.inject({ method: "GET", url: `${base}/evidence/${legacy.json().id}`, headers })
    expect(get.json()).toEqual(legacy.json())
  })

  it("fails closed for authentication, membership, foreign organization/learner, Goal and Step", async () => {
    const f = await setup()
    const denied = [
      { url: trustedUrl, requestHeaders: { "content-type": "application/json" }, status: 401 },
      { url: trustedUrl.replace("org-a", "no-membership"), requestHeaders: headers, status: 403 },
      { url: trustedUrl.replace("org-a", "org-b"), requestHeaders: headers, status: 404 },
      { url: trustedUrl, requestHeaders: { ...headers, cookie: `${AUTH_COOKIE_NAME}=other` }, status: 404 },
      { url: trustedUrl.replace("goal-a", "wrong-goal"), requestHeaders: headers, status: 404 },
      { url: trustedUrl.replace("step-a", "unknown-step"), requestHeaders: headers, status: 404 },
    ]
    for (const { url, requestHeaders, status } of denied) {
      const response = await f.app.inject({ method: "POST", url, headers: requestHeaders, payload: { selections } })
      expect(response.statusCode).toBe(status)
      if (status === 404) expect(response.json()).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    }
    expect(f.ownedEvidence.records).toHaveLength(0)
    expect(f.ownedQuizzes.getOwned).not.toHaveBeenCalled()
    const saved = await f.submit({ selections })
    for (const { url, requestHeaders, status } of denied) {
      const goalBase = url.split("/steps/")[0]
      const evidenceId = url.includes("unknown-step") ? "unknown-evidence" : saved.json().id
      const response = await f.app.inject({ method: "GET", url: `${goalBase}/evidence/${evidenceId}`, headers: requestHeaders })
      expect(response.statusCode).toBe(status)
      if (status === 404) expect(response.json()).toEqual({ code: "RESOURCE_NOT_FOUND", message: "Not found" })
    }
  })

  it("requires the quiz for the requested Step and cannot borrow another Step's key", async () => {
    const f = await setup()
    f.keys.delete("step-a")
    f.keys.set("step-b", quiz)
    expect((await f.submit({ selections })).json().code).toBe("QUIZ_DEFINITION_REQUIRED")
    expect(f.ownedEvidence.records).toHaveLength(0)
    expect(f.ownedQuizzes.getOwned).toHaveBeenCalledWith("step-a", "goal-a", { organizationId: "org-a", learnerId: "learner-a" })
  })
})
