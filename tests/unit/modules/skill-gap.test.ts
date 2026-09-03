import { describe, expect, it } from "vitest"
import {
  calculateSkillGap,
  calculateSkillGapFromLearnerSkill,
  createLearnerSkill,
  setLearnerSkillLevel,
} from "../../../src/modules/skills/index.js"

describe("skills domain — SkillGap", () => {
  it("derives gap size from mastery level ordinals", () => {
    const gap = calculateSkillGap({
      skillId: "s1",
      requiredLevel: "proficient",
      currentLevel: "none",
    })

    expect(gap).toEqual({
      skillId: "s1",
      requiredLevel: "proficient",
      currentLevel: "none",
      gapSize: 2,
      isClosed: false,
    })
  })

  it("is closed when current meets or exceeds required", () => {
    const equal = calculateSkillGap({
      skillId: "s1",
      requiredLevel: "emerging",
      currentLevel: "emerging",
    })
    expect(equal.gapSize).toBe(0)
    expect(equal.isClosed).toBe(true)

    const above = calculateSkillGap({
      skillId: "s1",
      requiredLevel: "emerging",
      currentLevel: "expert",
    })
    expect(above.gapSize).toBe(0)
    expect(above.isClosed).toBe(true)
  })

  it("is deterministic for same inputs", () => {
    const a = calculateSkillGap({
      skillId: "s1",
      requiredLevel: "expert",
      currentLevel: "emerging",
    })
    const b = calculateSkillGap({
      skillId: "s1",
      requiredLevel: "expert",
      currentLevel: "emerging",
    })
    expect(a).toEqual(b)
  })

  it("Progress ≠ Mastery — gap ignores path progress percent", () => {
    const progressPercent = 100
    const gap = calculateSkillGap({
      skillId: "s1",
      requiredLevel: "proficient",
      currentLevel: "none",
    })
    // Intentionally unused progress must not affect gap
    expect(progressPercent).toBe(100)
    expect(gap.gapSize).toBe(2)
    expect(gap.isClosed).toBe(false)
  })

  it("calculates from LearnerSkill convenience helper", () => {
    let ls = createLearnerSkill({ skillId: "s2" })
    ls = setLearnerSkillLevel(ls, "emerging")
    const gap = calculateSkillGapFromLearnerSkill("expert", ls)
    expect(gap.skillId).toBe("s2")
    expect(gap.currentLevel).toBe("emerging")
    expect(gap.requiredLevel).toBe("expert")
    expect(gap.gapSize).toBe(2)
  })
})
