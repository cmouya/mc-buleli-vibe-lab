import { describe, expect, it } from "vitest"
import {
  DomainError,
  assertGoalReadyForPath,
  confirmGoal,
  createGoal,
  isGoalConfirmed,
  markGoalAnalyzed,
} from "../../../src/modules/goals/index.js"
import { createSkill } from "../../../src/modules/skills/index.js"

const NOW = "2026-09-03T12:00:00.000Z"

describe("goals domain", () => {
  it("creates a draft goal with non-empty statement", () => {
    const goal = createGoal({
      id: "g1",
      statement: "  Maîtriser Outlook  ",
      level: "debutant",
      hoursPerWeek: 5,
      intent: "professionnel",
    })

    expect(goal).toEqual({
      id: "g1",
      statement: "Maîtriser Outlook",
      level: "debutant",
      hoursPerWeek: 5,
      intent: "professionnel",
      status: "draft",
    })
  })

  it("rejects empty or whitespace statement", () => {
    expect(() =>
      createGoal({
        statement: "   ",
        level: "debutant",
        hoursPerWeek: 5,
        intent: "personnel",
      }),
    ).toThrow(DomainError)
  })

  it("marks analyzed and confirms deterministically", () => {
    const draft = createGoal({
      statement: "Apprendre Excel",
      level: "intermediaire",
      hoursPerWeek: 3,
      intent: "academique",
    })

    const analyzed = markGoalAnalyzed(draft, { now: NOW })
    expect(analyzed.status).toBe("analyzed")
    expect(analyzed.analyzedAt).toBe(NOW)

    const confirmed = confirmGoal(analyzed, { now: "2026-09-03T13:00:00.000Z" })
    expect(confirmed.status).toBe("confirmed")
    expect(confirmed.confirmedAt).toBe("2026-09-03T13:00:00.000Z")
    expect(isGoalConfirmed(confirmed)).toBe(true)
  })

  it("assertGoalReadyForPath fails on draft (I-01)", () => {
    const draft = createGoal({
      statement: "Goal",
      level: "debutant",
      hoursPerWeek: 2,
      intent: "professionnel",
    })

    expect(() => assertGoalReadyForPath(draft)).toThrow(DomainError)
    expect(isGoalConfirmed(draft)).toBe(false)

    const confirmed = confirmGoal(draft, { now: NOW })
    expect(() => assertGoalReadyForPath(confirmed)).not.toThrow()
  })

  it("Goal ≠ Skill — distinct shapes", () => {
    const goal = createGoal({
      statement: "Become proficient in AI tools",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "professionnel",
      id: "goal-1",
    })
    const skill = createSkill({ id: "skill-1", name: "AI Literacy" })

    expect("statement" in goal && "status" in goal).toBe(true)
    expect("name" in skill && "id" in skill).toBe(true)
    expect("masteryLevel" in skill).toBe(false)
    expect(goal.statement).not.toBe(skill.name)
  })
})
