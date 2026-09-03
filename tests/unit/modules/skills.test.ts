import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import { createSkill, isSkill } from "../../../src/modules/skills/index.js"
import { createLearnerSkill } from "../../../src/modules/skills/index.js"
import { createGoal } from "../../../src/modules/goals/index.js"

describe("skills domain — Skill", () => {
  it("creates a skill with required id and name", () => {
    const skill = createSkill({
      id: "sk-culture-ia",
      name: "Culture IA",
      description: "Fondamentaux",
      domain: "AI",
      prerequisiteIds: [],
    })

    expect(skill).toEqual({
      id: "sk-culture-ia",
      name: "Culture IA",
      description: "Fondamentaux",
      domain: "AI",
      prerequisiteIds: [],
    })
  })

  it("rejects empty id or name", () => {
    expect(() => createSkill({ id: " ", name: "X" })).toThrow(DomainError)
    expect(() => createSkill({ id: "x", name: "  " })).toThrow(DomainError)
  })

  it("isSkill distinguishes Skill from Goal and LearnerSkill", () => {
    const skill = createSkill({ id: "s1", name: "Email" })
    const goal = createGoal({
      statement: "Improve email",
      level: "debutant",
      hoursPerWeek: 2,
      intent: "professionnel",
    })
    const learnerSkill = createLearnerSkill({ skillId: "s1" })

    expect(isSkill(skill)).toBe(true)
    expect(isSkill(goal)).toBe(false)
    expect(isSkill(learnerSkill)).toBe(false)
  })

  it("Skill ≠ LearnerSkill — Skill has no masteryLevel", () => {
    const skill = createSkill({ id: "s1", name: "Diagnostic e-mail" })
    expect(skill).not.toHaveProperty("masteryLevel")
    expect(skill).not.toHaveProperty("evidenceIds")
  })
})
