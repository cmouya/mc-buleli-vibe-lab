import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { bindOwnedStepSkill } from "../../../src/application/bind-owned-step-skill.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import type { GoalOwnerScope } from "../../../src/modules/goals/index.js"
import type { StepSkillCoverage, StepSkillRepository } from "../../../src/modules/skills/index.js"

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function memoryBinds(): StepSkillRepository & {
  calls: Array<{ stepId: string; skillId: string; scope: GoalOwnerScope }>
} {
  const calls: Array<{ stepId: string; skillId: string; scope: GoalOwnerScope }> = []
  return {
    calls,
    async bindOwned(stepId, skillId, scope) {
      calls.push({ stepId, skillId, scope })
      const pair: StepSkillCoverage = { stepId, skillId }
      return pair
    },
  }
}

describe("application — bindOwnedStepSkill", () => {
  it("delegates using LearnerContext and ignores forged tenant fields", async () => {
    const repository = memoryBinds()
    const result = await bindOwnedStepSkill(
      {
        stepId: "step-1",
        skillId: "skill-1",
        organizationId: "org-forged",
        learnerId: "lrn-forged",
      },
      contextA(),
      repository,
    )
    expect(result).toEqual({ stepId: "step-1", skillId: "skill-1" })
    expect(repository.calls).toHaveLength(1)
    expect(repository.calls[0]?.scope).toEqual({
      organizationId: "org-a",
      learnerId: "lrn-a",
    })
    expect(repository.calls[0]?.scope.organizationId).not.toBe("org-forged")
    expect(repository.calls[0]?.scope.learnerId).not.toBe("lrn-forged")
  })

  it("keeps bindOwnedStepSkill free of infrastructure and server stacks", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/bind-owned-step-skill.ts"),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
