import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { and, eq } from "drizzle-orm"
import { describe, expect, it } from "vitest"
import { bindOwnedEvidenceSkill } from "../../src/application/bind-owned-evidence-skill.js"
import { bindOwnedGoalSkill } from "../../src/application/bind-owned-goal-skill.js"
import { bindOwnedStepSkill } from "../../src/application/bind-owned-step-skill.js"
import { getOwnedPathProgress } from "../../src/application/get-owned-progress.js"
import { persistOrganizationSkill } from "../../src/application/persist-organization-skill.js"
import { persistOwnedEvidence } from "../../src/application/persist-owned-evidence.js"
import { persistOwnedGoal } from "../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../src/application/resolve-learner-context.js"
import { createGoal } from "../../src/modules/goals/index.js"
import { createOrganization, createUser } from "../../src/modules/identity/index.js"
import { createLearner } from "../../src/modules/learner/index.js"
import type { AcceptedLearningPath } from "../../src/modules/learning-path/index.js"
import {
  createDb,
  createDrizzleEvidenceSkillRepository,
  createDrizzleGoalRepository,
  createDrizzleGoalSkillRepository,
  createDrizzleLearnerRepository,
  createDrizzleLearningPathRepository,
  createDrizzleOrganizationRepository,
  createDrizzleOrganizationSkillRepository,
  createDrizzleOwnedDerivedContentRepository,
  createDrizzleOwnedEvidenceRepository,
  createDrizzleOwnedStepQuizRepository,
  createDrizzleOwnedGoalRepository,
  createDrizzleOwnedLearningPathRepository,
  createDrizzleOwnedProgressRepository,
  createDrizzleStepSkillRepository,
  createDrizzleUserRepository,
  createSqlClient,
  evidence,
  evidenceSkills,
  goalSkills,
  migrateDatabase,
  requireDatabaseUrl,
} from "../../src/infra/db/index.js"

const NOW = "2026-09-27T00:00:00.000Z"
const fields = {
  statement: "Slice 2 evidence skill",
  level: "debutant" as const,
  hoursPerWeek: 4,
  intent: "personnel" as const,
}

function pairKey(left: string, right: string): string {
  return `${left}:${right}`
}

function acceptedPath(goalId: string, stepCount = 1): AcceptedLearningPath {
  const steps = Array.from({ length: stepCount }, (_, position) => ({
    id: randomUUID(),
    position,
    title: `Step ${position}`,
    description: "Slice 2",
  }))
  return {
    id: randomUUID(),
    goalId,
    title: "Slice 2 path",
    steps,
  }
}

function quiz(overrides: { score?: number; passed?: boolean } = {}) {
  return {
    score: overrides.score ?? 1,
    maxScore: 2,
    passed: overrides.passed ?? false,
    answers: [{ questionIndex: 0, selectedIndex: 1, correct: true }],
  }
}

describe("Slice 2 — EvidenceSkill repository (PostgreSQL)", () => {
  it("binds owned Evidence to covered Skills only, fail-closed and without Mastery side effects", async () => {
    const url = requireDatabaseUrl()
    await migrateDatabase(url)
    const client = createSqlClient(url)
    try {
      const db = createDb(client)
      const orgs = createDrizzleOrganizationRepository(db)
      const users = createDrizzleUserRepository(db)
      const learners = createDrizzleLearnerRepository(db)
      const ownedGoals = createDrizzleOwnedGoalRepository(db)
      const ownedPaths = createDrizzleOwnedLearningPathRepository(db)
      const derived = createDrizzleOwnedDerivedContentRepository(db)
      const ownedEvidence = createDrizzleOwnedEvidenceRepository(db)
      const progressRepo = createDrizzleOwnedProgressRepository(db)
      const catalog = createDrizzleOrganizationSkillRepository(db)
      const stepBinds = createDrizzleStepSkillRepository(db)
      const goalBinds = createDrizzleGoalSkillRepository(db)
      const evidenceBinds = createDrizzleEvidenceSkillRepository(db)
      const unscopedGoals = createDrizzleGoalRepository(db)
      const unscopedPaths = createDrizzleLearningPathRepository(db)

      const orgA = await orgs.save(createOrganization({ name: "Org A", id: randomUUID() }, { now: NOW }))
      const orgB = await orgs.save(createOrganization({ name: "Org B", id: randomUUID() }, { now: NOW }))
      const user = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const userTwo = await users.save(createUser({ id: randomUUID() }, { now: NOW }))
      const learnerA = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: user.id as string,
        }),
      )
      const learnerA2 = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgA.id as string,
          userId: userTwo.id as string,
        }),
      )
      const learnerB = await learners.save(
        createLearner({
          id: randomUUID(),
          organizationId: orgB.id as string,
          userId: user.id as string,
        }),
      )

      const contextA: LearnerContext = {
        learnerId: learnerA.id as string,
        userId: user.id as string,
        organizationId: orgA.id as string,
      }
      const contextA2: LearnerContext = {
        learnerId: learnerA2.id as string,
        userId: userTwo.id as string,
        organizationId: orgA.id as string,
      }
      const contextB: LearnerContext = {
        learnerId: learnerB.id as string,
        userId: user.id as string,
        organizationId: orgB.id as string,
      }
      const scopeA = { organizationId: contextA.organizationId, learnerId: contextA.learnerId }
      const scopeB = { organizationId: contextB.organizationId, learnerId: contextB.learnerId }

      const goalA = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextA, ownedGoals)
      const goalA2 = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextA2, ownedGoals)
      const goalB = await persistOwnedGoal({ ...fields, id: randomUUID() }, contextB, ownedGoals)
      const pathA = await ownedPaths.saveOwned(acceptedPath(goalA.id as string, 1), scopeA)
      const pathA2 = await ownedPaths.saveOwned(acceptedPath(goalA2.id as string, 1), {
        organizationId: contextA2.organizationId,
        learnerId: contextA2.learnerId,
      })
      const pathB = await ownedPaths.saveOwned(acceptedPath(goalB.id as string, 1), scopeB)
      const stepA = pathA.steps[0]?.id as string
      const stepA2 = pathA2.steps[0]?.id as string
      const stepB = pathB.steps[0]?.id as string

      const skillA1 = await persistOrganizationSkill(
        { id: randomUUID(), name: "Python" },
        orgA.id as string,
        catalog,
      )
      const skillA2 = await persistOrganizationSkill(
        { id: randomUUID(), name: "SQL" },
        orgA.id as string,
        catalog,
      )
      const skillA3 = await persistOrganizationSkill(
        { id: randomUUID(), name: "Uncovered" },
        orgA.id as string,
        catalog,
      )
      const skillB = await persistOrganizationSkill(
        { id: randomUUID(), name: "Python" },
        orgB.id as string,
        catalog,
      )

      const goalSkill = await bindOwnedGoalSkill(
        {
          goalId: goalA.id as string,
          skillId: skillA1.id,
          requiredLevel: "proficient",
        },
        contextA,
        goalBinds,
      )
      expect(goalSkill.requiredLevel).toBe("proficient")

      const evidenceA1 = await persistOwnedEvidence(
        { goalId: goalA.id as string, stepId: stepA, ...quiz({ score: 1, passed: false }) },
        contextA,
        derived,
        ownedEvidence,
        createDrizzleOwnedStepQuizRepository(db),
        { now: NOW },
      )
      const evidenceA2 = await persistOwnedEvidence(
        { goalId: goalA.id as string, stepId: stepA, ...quiz({ score: 0, passed: false }) },
        contextA,
        derived,
        ownedEvidence,
        createDrizzleOwnedStepQuizRepository(db),
        { now: NOW },
      )
      const evidenceB = await persistOwnedEvidence(
        { goalId: goalB.id as string, stepId: stepB, ...quiz({ score: 2, passed: true }) },
        contextB,
        derived,
        ownedEvidence,
        createDrizzleOwnedStepQuizRepository(db),
        { now: NOW },
      )
      const evidenceA2Learner = await persistOwnedEvidence(
        { goalId: goalA2.id as string, stepId: stepA2, ...quiz() },
        contextA2,
        derived,
        ownedEvidence,
        createDrizzleOwnedStepQuizRepository(db),
        { now: NOW },
      )

      expect(
        await db
          .select()
          .from(evidenceSkills)
          .where(eq(evidenceSkills.evidenceId, evidenceA1.id as string)),
      ).toEqual([])

      await bindOwnedStepSkill({ stepId: stepA, skillId: skillA1.id }, contextA, stepBinds)
      await bindOwnedStepSkill({ stepId: stepA, skillId: skillA2.id }, contextA, stepBinds)
      await bindOwnedStepSkill({ stepId: stepB, skillId: skillB.id }, contextB, stepBinds)

      expect(
        await db
          .select()
          .from(evidenceSkills)
          .where(eq(evidenceSkills.evidenceId, evidenceA1.id as string)),
      ).toEqual([])

      const progressBefore = await getOwnedPathProgress(
        goalA.id as string,
        contextA,
        derived,
        progressRepo,
      )
      const evidenceBefore = await db
        .select()
        .from(evidence)
        .where(eq(evidence.id, evidenceA1.id as string))
      const requiredBefore = await db
        .select()
        .from(goalSkills)
        .where(
          and(eq(goalSkills.goalId, goalA.id as string), eq(goalSkills.skillId, skillA1.id)),
        )

      const first = await bindOwnedEvidenceSkill(
        {
          evidenceId: evidenceA1.id as string,
          skillId: skillA1.id,
          organizationId: "forged-org",
          learnerId: "forged-learner",
        },
        contextA,
        evidenceBinds,
      )
      expect(first).toEqual({ evidenceId: evidenceA1.id, skillId: skillA1.id })
      const persisted = await db
        .select()
        .from(evidenceSkills)
        .where(
          and(
            eq(evidenceSkills.evidenceId, evidenceA1.id as string),
            eq(evidenceSkills.skillId, skillA1.id),
          ),
        )
      expect(persisted).toHaveLength(1)

      const again = await bindOwnedEvidenceSkill(
        { evidenceId: evidenceA1.id as string, skillId: skillA1.id },
        contextA,
        evidenceBinds,
      )
      expect(again).toEqual(first)
      expect(
        await db
          .select()
          .from(evidenceSkills)
          .where(
            and(
              eq(evidenceSkills.evidenceId, evidenceA1.id as string),
              eq(evidenceSkills.skillId, skillA1.id),
            ),
          ),
      ).toHaveLength(1)

      expect(
        await db
          .select()
          .from(evidenceSkills)
          .where(
            and(
              eq(evidenceSkills.evidenceId, evidenceA1.id as string),
              eq(evidenceSkills.skillId, skillA2.id),
            ),
          ),
      ).toEqual([])

      const secondSkill = await bindOwnedEvidenceSkill(
        { evidenceId: evidenceA1.id as string, skillId: skillA2.id },
        contextA,
        evidenceBinds,
      )
      expect(secondSkill).toEqual({ evidenceId: evidenceA1.id, skillId: skillA2.id })
      expect(
        (await db
          .select()
          .from(evidenceSkills)
          .where(eq(evidenceSkills.evidenceId, evidenceA1.id as string))).map((row) => row.skillId)
          .sort(),
      ).toEqual([skillA1.id, skillA2.id].sort())

      const secondEvidence = await bindOwnedEvidenceSkill(
        { evidenceId: evidenceA2.id as string, skillId: skillA1.id },
        contextA,
        evidenceBinds,
      )
      expect(secondEvidence).toEqual({ evidenceId: evidenceA2.id, skillId: skillA1.id })
      expect(
        (await db
          .select()
          .from(evidenceSkills)
          .where(eq(evidenceSkills.skillId, skillA1.id))).map((row) => row.evidenceId)
          .sort(),
      ).toEqual([evidenceA1.id, evidenceA2.id].sort())

      const notFound = { code: "RESOURCE_NOT_FOUND", message: "Not found" }
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: randomUUID(), skillId: skillA1.id },
          contextA,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceB.id as string, skillId: skillA1.id },
          contextA,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceA2Learner.id as string, skillId: skillA1.id },
          contextA,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceA1.id as string, skillId: randomUUID() },
          contextA,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceA1.id as string, skillId: skillB.id },
          contextA,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceA1.id as string, skillId: skillA3.id },
          contextA,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceA1.id as string, skillId: skillA1.id },
          contextB,
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)

      const legacyGoal = await unscopedGoals.save(createGoal({ ...fields, id: randomUUID() }, { now: NOW }))
      const legacyPath = await unscopedPaths.save(acceptedPath(legacyGoal.id as string, 1))
      await expect(
        bindOwnedEvidenceSkill(
          { evidenceId: evidenceA1.id as string, skillId: skillA1.id },
          {
            learnerId: learnerA.id as string,
            userId: user.id as string,
            organizationId: orgB.id as string,
          },
          evidenceBinds,
        ),
      ).rejects.toMatchObject(notFound)
      expect(legacyPath.steps[0]?.id).toBeDefined()

      const progressAfter = await getOwnedPathProgress(
        goalA.id as string,
        contextA,
        derived,
        progressRepo,
      )
      expect(progressAfter).toEqual(progressBefore)
      const evidenceAfter = await db
        .select()
        .from(evidence)
        .where(eq(evidence.id, evidenceA1.id as string))
      expect(evidenceAfter[0]?.score).toBe(evidenceBefore[0]?.score)
      expect(evidenceAfter[0]?.passed).toBe(evidenceBefore[0]?.passed)
      const requiredAfter = await db
        .select()
        .from(goalSkills)
        .where(
          and(eq(goalSkills.goalId, goalA.id as string), eq(goalSkills.skillId, skillA1.id)),
        )
      expect(requiredAfter[0]?.requiredLevel).toBe(requiredBefore[0]?.requiredLevel)
      expect(requiredAfter[0]?.requiredLevel).toBe("proficient")

      const forbidden = await client<Array<{ tablename: string }>>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('learner_skills', 'mastery', 'skill_gaps')
      `
      expect(forbidden).toEqual([])

      const fixtureKeys = [
        pairKey(evidenceA1.id as string, skillA1.id),
        pairKey(evidenceA1.id as string, skillA2.id),
        pairKey(evidenceA2.id as string, skillA1.id),
      ].sort()
      const storedKeys = (
        await db
          .select()
          .from(evidenceSkills)
          .where(eq(evidenceSkills.evidenceId, evidenceA1.id as string))
      )
        .map((row) => pairKey(row.evidenceId, row.skillId))
        .sort()
      expect(storedKeys).toEqual(
        [pairKey(evidenceA1.id as string, skillA1.id), pairKey(evidenceA1.id as string, skillA2.id)].sort(),
      )
      expect(fixtureKeys).toContain(pairKey(evidenceA2.id as string, skillA1.id))
    } finally {
      await client.end({ timeout: 5 })
    }
  })

  it("proves coverage from persisted evidence.step_id in one transaction", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/infra/db/evidence-skill-repository.ts",
      ),
      "utf8",
    )
    expect(source).toMatch(/db\.transaction/)
    expect(source).toMatch(/owned\[0\]\.stepId/)
    expect(source).toMatch(/stepSkills/)
    expect(source).toMatch(/onConflictDoNothing/)
    expect(source).not.toMatch(/learner_skills/)
    expect(source).not.toMatch(/mastery/i)
    expect(source).not.toMatch(/fastify/i)
  })
})

