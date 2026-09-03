import { describe, expect, it } from "vitest"
import { DomainError } from "../../../src/modules/shared/index.js"
import {
  addLearnerSkillEvidenceRef,
  createLearnerSkill,
  createSkill,
  setLearnerSkillLevel,
} from "../../../src/modules/skills/index.js"

const NOW = "2026-09-03T14:00:00.000Z"

describe("skills domain — LearnerSkill", () => {
  it("creates LearnerSkill at none with empty evidence", () => {
    const ls = createLearnerSkill({ skillId: "s1", learnerId: "l1" })
    expect(ls).toEqual({
      skillId: "s1",
      learnerId: "l1",
      masteryLevel: "none",
      evidenceIds: [],
    })
  })

  it("sets level explicitly without inventing mastery from evidence", () => {
    const ls = createLearnerSkill({ skillId: "s1" })
    const withEvidence = addLearnerSkillEvidenceRef(ls, "ev-1")
    expect(withEvidence.masteryLevel).toBe("none")
    expect(withEvidence.evidenceIds).toEqual(["ev-1"])

    const updated = setLearnerSkillLevel(withEvidence, "emerging", { now: NOW })
    expect(updated.masteryLevel).toBe("emerging")
    expect(updated.lastAssessedAt).toBe(NOW)
    expect(updated.evidenceIds).toEqual(["ev-1"])
  })

  it("does not duplicate evidence refs", () => {
    const ls = createLearnerSkill({ skillId: "s1" })
    const once = addLearnerSkillEvidenceRef(ls, "ev-1")
    const twice = addLearnerSkillEvidenceRef(once, "ev-1")
    expect(twice.evidenceIds).toEqual(["ev-1"])
  })

  it("Skill ≠ LearnerSkill — separate constructors", () => {
    const skill = createSkill({ id: "s1", name: "Outlook" })
    const ls = createLearnerSkill({ skillId: skill.id })
    expect(ls.skillId).toBe(skill.id)
    expect("name" in ls).toBe(false)
    expect("masteryLevel" in skill).toBe(false)
  })

  it("rejects empty skillId", () => {
    expect(() => createLearnerSkill({ skillId: "  " })).toThrow(DomainError)
  })
})
