import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { getOwnedEvidence, getOwnedPath, getOwnedStep } from "../../src/application/get-owned-derived-content.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import { recordQuizEvidence } from "../../src/modules/evidence/index.js"
import { createGoal } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import {
  createDb,
  createDrizzleEvidenceRepository,
  createDrizzleGoalRepository,
  createDrizzleLearnerRepository,
  createDrizzleLearningPathRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOwnedDerivedContentRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleUserRepository,
  createSqlClient,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

function pathFor(goalId: string, stepId = randomUUID()): AcceptedLearningPath {
  return {
    id: randomUUID(),
    goalId,
    title: "Owned path",
    steps: [{ id: stepId, position: 0, title: "Step", description: "desc" }],
  }
}

describe("M6.1 C7 — derived Path/Step/Evidence ownership (PostgreSQL)", () => {
  it("scopes descendant reads through Goal organization_id and learner_id joins", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const ownedGoals = createDrizzleOwnedGoalRepository(db)
      const legacyGoals = createDrizzleGoalRepository(db)
      const paths = createDrizzleLearningPathRepository(db)
      const evidenceRepo = createDrizzleEvidenceRepository(db)
      const derived = createDrizzleOwnedDerivedContentRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }))
      const userU = await users.save(createUser({ id: randomUUID() }))
      const userTwo = await users.save(createUser({ id: randomUUID() }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userU.id as string,
        }),
      )
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: userU.id as string,
        }),
      )
      const learnerA2 = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userTwo.id as string,
        }),
      )

      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: userU.id as string,
        organizationId: orgA.id as string,
      }
      const contextB: LearnerContext = {
        learnerId: learnerB.id as string,
        userId: userU.id as string,
        organizationId: orgB.id as string,
      }
      const contextA2: LearnerContext = {
        learnerId: learnerA2.id as string,
        userId: userTwo.id as string,
        organizationId: orgA.id as string,
      }

      const goalA = await persistOwnedGoal(
        { statement: "GA", level: "debutant", hoursPerWeek: 4, intent: "personnel" },
        contextA,
        ownedGoals,
      )
      const goalB = await persistOwnedGoal(
        { statement: "GB", level: "debutant", hoursPerWeek: 4, intent: "personnel" },
        contextB,
        ownedGoals,
      )
      const pathA = await paths.save(pathFor(goalA.id as string))
      const pathB = await paths.save(pathFor(goalB.id as string))
      const evidenceA = await evidenceRepo.save(
        recordQuizEvidence(
          {
            id: randomUUID(),
            stepId: pathA.steps[0]!.id,
            score: 1,
            maxScore: 1,
            passed: true,
            answers: [],
          },
          { now: "2026-09-19T12:00:00.000Z" },
        ),
      )

      expect((await getOwnedPath(goalA.id as string, contextA, derived))?.id).toBe(pathA.id)
      expect(await getOwnedStep(pathA.steps[0]!.id, goalA.id as string, contextA, derived)).toMatchObject(
        { id: pathA.steps[0]!.id },
      )
      expect(await getOwnedEvidence(evidenceA.id as string, goalA.id as string, contextA, derived)).toMatchObject(
        { id: evidenceA.id },
      )

      expect(await getOwnedPath(goalA.id as string, contextB, derived)).toBeNull()
      expect(await getOwnedPath(goalA.id as string, contextA2, derived)).toBeNull()
      expect(await getOwnedStep(pathA.steps[0]!.id, goalA.id as string, contextB, derived)).toBeNull()
      expect(await getOwnedEvidence(evidenceA.id as string, goalA.id as string, contextB, derived)).toBeNull()

      expect(await getOwnedStep(pathA.steps[0]!.id, goalB.id as string, contextA, derived)).toBeNull()
      expect(await getOwnedStep(pathA.steps[0]!.id, goalB.id as string, contextB, derived)).toBeNull()
      expect(await getOwnedEvidence(evidenceA.id as string, goalB.id as string, contextA, derived)).toBeNull()
      expect(await getOwnedEvidence(evidenceA.id as string, goalB.id as string, contextB, derived)).toBeNull()

      expect((await getOwnedPath(goalB.id as string, contextB, derived))?.id).toBe(pathB.id)
      expect(await getOwnedPath(goalA.id as string, contextB, derived)).toBeNull()
      expect(await getOwnedPath(goalB.id as string, contextA, derived)).toBeNull()

      const legacy = await legacyGoals.save(
        createGoal({
          statement: "Legacy unowned",
          level: "debutant",
          hoursPerWeek: 3,
          intent: "personnel",
          id: randomUUID(),
        }),
      )
      const legacyPath = await paths.save(pathFor(legacy.id as string))
      const legacyEvidence = await evidenceRepo.save(
        recordQuizEvidence(
          {
            id: randomUUID(),
            stepId: legacyPath.steps[0]!.id,
            score: 1,
            maxScore: 1,
            passed: true,
            answers: [],
          },
          { now: "2026-09-19T12:00:00.000Z" },
        ),
      )
      expect(await getOwnedPath(legacy.id as string, contextA, derived)).toBeNull()
      expect(
        await getOwnedStep(legacyPath.steps[0]!.id, legacy.id as string, contextA, derived),
      ).toBeNull()
      expect(
        await getOwnedEvidence(legacyEvidence.id as string, legacy.id as string, contextA, derived),
      ).toBeNull()
      expect(await paths.getById(legacyPath.id)).toEqual(legacyPath)
      expect(await evidenceRepo.getById(legacyEvidence.id as string)).toEqual(legacyEvidence)
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("implements descendant reads with Goal joins, not generic getById authorization", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/infra/db/owned-derived-content-repository.ts",
      ),
      "utf8",
    )
    expect(source).toMatch(/innerJoin\(goals/)
    expect(source).toMatch(/eq\(goals\.organizationId/)
    expect(source).toMatch(/eq\(goals\.learnerId/)
    expect(source).toMatch(/eq\(learningPaths\.goalId/)
    expect(source).not.toMatch(/getById\(/)
    expect(source).not.toMatch(/organization_id/)
    expect(source).not.toMatch(/learner_id/)
  })
})
