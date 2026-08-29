import { describe, expect, it } from "vitest"
import { MockAIService } from "../../src/ai/MockAIService.js"

const OUTLOOK_GOAL =
  "J'aimerais apprendre à piloter un projet d'optimisation intelligente de la gestion des e-mails Outlook par l'IA pour cadres d'entreprises."

const DATA_GOAL = "Je veux devenir Data Analyst."

const IA_GOAL = "Je veux apprendre à utiliser l'IA pour développer mon activité."

const GENERIC_GOAL = "Je veux apprendre la guitare classique."

describe("MockAIService — generatePath", () => {
  const service = new MockAIService()

  it("generates outlook path for outlook/email objective", async () => {
    const result = await service.generatePath({
      goal: OUTLOOK_GOAL,
      level: "debutant",
      hoursPerWeek: 5,
    })
    expect(result.pathId).toBe("outlook-email-ia")
    expect(result.steps).toHaveLength(6)
    expect(result.steps[0].title.toLowerCase()).toContain("e-mail")
  })

  it("generates data analyst path for data objective", async () => {
    const result = await service.generatePath({
      goal: DATA_GOAL,
      level: "debutant",
      hoursPerWeek: 5,
    })
    expect(result.pathId).toBe("data-analyst")
    expect(result.steps[0].title.toLowerCase()).toContain("données")
  })

  it("generates ia path for ia + activité objective", async () => {
    const result = await service.generatePath({
      goal: IA_GOAL,
      level: "debutant",
      hoursPerWeek: 5,
    })
    expect(result.pathId).toBe("ia-pro")
    expect(result.steps[0].title.toLowerCase()).toContain("fondamentaux")
  })

  it("generates generic custom path for unmatched objectives", async () => {
    const result = await service.generatePath({
      goal: GENERIC_GOAL,
      level: "debutant",
      hoursPerWeek: 5,
    })
    expect(result.pathId.startsWith("custom-")).toBe(true)
    expect(result.pathTitle).toContain("guitare")
    expect(result.steps).toHaveLength(6)
  })

  it("returns independent step copies", async () => {
    const result = await service.generatePath({
      goal: IA_GOAL,
      level: "debutant",
      hoursPerWeek: 5,
    })
    result.steps[0].title = "Modified"
    const again = await service.generatePath({
      goal: IA_GOAL,
      level: "debutant",
      hoursPerWeek: 5,
    })
    expect(again.steps[0].title).not.toBe("Modified")
  })
})
