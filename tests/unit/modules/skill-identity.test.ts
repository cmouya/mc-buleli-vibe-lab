import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  assertSkillMatchesOrganization,
  bindGoalSkillRequirement,
  bindStepSkillCoverage,
  createGoalSkillRequirement,
  createOrganizationSkill,
  createStepSkillCoverage,
  isOrganizationSkill,
} from "../../../src/modules/skills/index.js"
import { createLearnerSkill } from "../../../src/modules/skills/index.js"
import { createGoal } from "../../../src/modules/goals/index.js"
import {
  evidenceAllowsCompletion,
  recordQuizEvidence,
} from "../../../src/modules/evidence/index.js"
import type { OwnedPathProgress } from "../../../src/application/get-owned-progress.js"

describe("skills domain — ADR-020 identity", () => {
  const orgA = "org-a"
  const orgB = "org-b"

  it("Skill identity is id-based, not label-based", () => {
    const sqlA = createOrganizationSkill({
      id: "skill-sql-a",
      organizationId: orgA,
      name: "SQL",
    })
    const sqlB = createOrganizationSkill({
      id: "skill-sql-b",
      organizationId: orgA,
      name: "SQL",
    })

    expect(sqlA.name).toBe(sqlB.name)
    expect(sqlA.id).not.toBe(sqlB.id)
  })

  it("same label in different organizations is not the same Skill", () => {
    const inA = createOrganizationSkill({ id: "sk-1", organizationId: orgA, name: "SQL" })
    const inB = createOrganizationSkill({ id: "sk-2", organizationId: orgB, name: "SQL" })

    expect(inA.name).toBe(inB.name)
    expect(inA.id).not.toBe(inB.id)
    expect(inA.organizationId).not.toBe(inB.organizationId)
  })

  it("Skill carries organization scope and rejects empty ids", () => {
    const skill = createOrganizationSkill({
      id: " sk-culture ",
      organizationId: " org-a ",
      name: " Culture IA ",
      description: "Fondamentaux",
    })

    expect(skill).toEqual({
      id: "sk-culture",
      organizationId: orgA,
      name: "Culture IA",
      description: "Fondamentaux",
    })
    expect(skill).not.toHaveProperty("goalId")
    expect(skill).not.toHaveProperty("learnerId")
    expect(skill).not.toHaveProperty("stepId")
    expect(skill).not.toHaveProperty("masteryLevel")
    expect(skill).not.toHaveProperty("requiredLevel")
    expect(skill).not.toHaveProperty("prerequisiteIds")

    expect(() => createOrganizationSkill({ id: " ", organizationId: orgA, name: "X" })).toThrow(
      DomainError,
    )
    expect(() => createOrganizationSkill({ id: "x", organizationId: " ", name: "X" })).toThrow(
      DomainError,
    )
    expect(() => createOrganizationSkill({ id: "x", organizationId: orgA, name: "  " })).toThrow(
      DomainError,
    )
  })

  it("isOrganizationSkill distinguishes catalog Skill from Goal and LearnerSkill", () => {
    const skill = createOrganizationSkill({ id: "s1", organizationId: orgA, name: "Email" })
    const goal = createGoal({
      statement: "Improve email",
      level: "debutant",
      hoursPerWeek: 2,
      intent: "professionnel",
    })
    const learnerSkill = createLearnerSkill({ skillId: "s1" })

    expect(isOrganizationSkill(skill)).toBe(true)
    expect(isOrganizationSkill(goal)).toBe(false)
    expect(isOrganizationSkill(learnerSkill)).toBe(false)
  })
})

describe("skills domain — Goal Skill Requirement", () => {
  const orgA = "org-a"
  const s1 = createOrganizationSkill({ id: "s1", organizationId: orgA, name: "SQL" })
  const s2 = createOrganizationSkill({ id: "s2", organizationId: orgA, name: "Culture IA" })

  it("Goal can reference multiple Skills; one Skill can be referenced by multiple Goals", () => {
    const g1s1 = bindGoalSkillRequirement({
      goalId: "g1",
      skill: s1,
      goalOrganizationId: orgA,
    })
    const g1s2 = bindGoalSkillRequirement({
      goalId: "g1",
      skill: s2,
      goalOrganizationId: orgA,
    })
    const g2s1 = bindGoalSkillRequirement({
      goalId: "g2",
      skill: s1,
      goalOrganizationId: orgA,
    })

    const goalRequirements = [g1s1, g1s2]
    const skillUsages = [g1s1, g2s1]

    expect(goalRequirements.map((row) => row.skillId).sort()).toEqual(["s1", "s2"])
    expect(skillUsages.map((row) => row.goalId).sort()).toEqual(["g1", "g2"])
    expect(g1s1).toEqual({ goalId: "g1", skillId: "s1" })
    expect(g1s1).not.toHaveProperty("requiredLevel")
    expect(g1s1).not.toHaveProperty("targetLevel")
    expect(g1s1).not.toHaveProperty("masteryLevel")
    expect(g1s1).not.toHaveProperty("organizationId")
  })

  it("rejects cross-organization Goal→Skill binding", () => {
    const foreign = createOrganizationSkill({
      id: "s-foreign",
      organizationId: "org-b",
      name: "SQL",
    })

    expect(() =>
      bindGoalSkillRequirement({
        goalId: "g1",
        skill: foreign,
        goalOrganizationId: orgA,
      }),
    ).toThrow(DomainError)

    try {
      bindGoalSkillRequirement({
        goalId: "g1",
        skill: foreign,
        goalOrganizationId: orgA,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      expect((error as DomainError).code).toBe("SKILL_ORGANIZATION_MISMATCH")
      expect((error as DomainError).message).toBe("Skill does not belong to this organization")
    }
  })

  it("createGoalSkillRequirement stores ids only", () => {
    expect(createGoalSkillRequirement({ goalId: " g1 ", skillId: " s1 " })).toEqual({
      goalId: "g1",
      skillId: "s1",
    })
    expect(() => createGoalSkillRequirement({ goalId: " ", skillId: "s1" })).toThrow(DomainError)
  })
})

describe("skills domain — Step Skill Coverage", () => {
  const orgA = "org-a"
  const s1 = createOrganizationSkill({ id: "s1", organizationId: orgA, name: "SQL" })
  const s2 = createOrganizationSkill({ id: "s2", organizationId: orgA, name: "Culture IA" })

  it("Step can cover multiple Skills; one Skill can be covered by multiple Steps", () => {
    const aS1 = bindStepSkillCoverage({
      stepId: "step-a",
      skill: s1,
      trustedOrganizationId: orgA,
    })
    const aS2 = bindStepSkillCoverage({
      stepId: "step-a",
      skill: s2,
      trustedOrganizationId: orgA,
    })
    const bS1 = bindStepSkillCoverage({
      stepId: "step-b",
      skill: s1,
      trustedOrganizationId: orgA,
    })

    expect([aS1, aS2].map((row) => row.skillId).sort()).toEqual(["s1", "s2"])
    expect([aS1, bS1].map((row) => row.stepId).sort()).toEqual(["step-a", "step-b"])
    expect(aS1).toEqual({ stepId: "step-a", skillId: "s1" })
    expect(aS1).not.toHaveProperty("primarySkill")
    expect(aS1).not.toHaveProperty("coverageWeight")
    expect(aS1).not.toHaveProperty("masteryLevel")
    expect(aS1).not.toHaveProperty("requiredLevel")
    expect(aS1).not.toHaveProperty("organizationId")
  })

  it("rejects cross-organization Step→Skill binding using Goal-rooted trusted organization", () => {
    const foreign = createOrganizationSkill({
      id: "s-foreign",
      organizationId: "org-b",
      name: "SQL",
    })

    expect(() =>
      bindStepSkillCoverage({
        stepId: "step-a",
        skill: foreign,
        trustedOrganizationId: orgA,
      }),
    ).toThrow(DomainError)

    try {
      bindStepSkillCoverage({
        stepId: "step-a",
        skill: foreign,
        trustedOrganizationId: orgA,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      expect((error as DomainError).code).toBe("SKILL_ORGANIZATION_MISMATCH")
    }
  })

  it("createStepSkillCoverage stores ids only", () => {
    expect(createStepSkillCoverage({ stepId: " st1 ", skillId: " s1 " })).toEqual({
      stepId: "st1",
      skillId: "s1",
    })
  })
})

describe("skills domain — Completion and Progress remain independent of Skill", () => {
  it("Evidence remains Step-scoped; coverage does not grant completion or Mastery", () => {
    const skill = createOrganizationSkill({
      id: "s1",
      organizationId: "org-a",
      name: "SQL",
    })
    const coverage = bindStepSkillCoverage({
      stepId: "step-1",
      skill,
      trustedOrganizationId: "org-a",
    })
    const evidence = recordQuizEvidence({
      stepId: "step-1",
      score: 3,
      maxScore: 3,
      passed: true,
      answers: [],
    })

    expect(evidence).not.toHaveProperty("skillId")
    expect("skillId" in evidence).toBe(false)
    expect(evidenceAllowsCompletion(evidence, "step-1")).toBe(true)
    expect(evidenceAllowsCompletion(evidence, coverage.skillId)).toBe(false)
    expect(coverage).not.toHaveProperty("complete")
  })

  it("Path Progress shape has no Mastery or Skill fields", () => {
    const progress: OwnedPathProgress = {
      totalSteps: 2,
      completedSteps: 1,
      progressPercent: 50,
    }

    expect(Object.keys(progress).sort()).toEqual(
      ["completedSteps", "progressPercent", "totalSteps"].sort(),
    )
    expect(progress).not.toHaveProperty("skillId")
    expect(progress).not.toHaveProperty("masteryLevel")
  })

  it("assertSkillMatchesOrganization does not use labels as identity", () => {
    const skill = createOrganizationSkill({
      id: "s1",
      organizationId: "org-a",
      name: "SQL",
    })
    expect(() => assertSkillMatchesOrganization(skill, "org-a")).not.toThrow()
    expect(() => assertSkillMatchesOrganization(skill, "org-b")).toThrow(DomainError)
  })
})
