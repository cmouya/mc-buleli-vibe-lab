import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { bindOwnedGoalSkill } from "../../../src/application/bind-owned-goal-skill.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import type { GoalOwnerScope } from "../../../src/modules/goals/index.js"
import type {
  GoalSkillRepository,
  GoalSkillRequirement,
} from "../../../src/modules/skills/index.js"

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function memoryBinds(): GoalSkillRepository & {
  calls: Array<{ goalId: string; skillId: string; scope: GoalOwnerScope }>
} {
  const calls: Array<{ goalId: string; skillId: string; scope: GoalOwnerScope }> = []
  return {
    calls,
    async bindOwned(goalId, skillId, scope) {
      calls.push({ goalId, skillId, scope })
      const pair: GoalSkillRequirement = { goalId, skillId }
      return pair
    },
  }
}

describe("application — bindOwnedGoalSkill", () => {
  it("delegates using LearnerContext and ignores forged tenant fields", async () => {
    const repository = memoryBinds()
    const result = await bindOwnedGoalSkill(
      {
        goalId: "goal-1",
        skillId: "skill-1",
        organizationId: "org-forged",
        learnerId: "lrn-forged",
      },
      contextA(),
      repository,
    )
    expect(result).toEqual({ goalId: "goal-1", skillId: "skill-1" })
    expect(repository.calls).toHaveLength(1)
    expect(repository.calls[0]?.scope).toEqual({
      organizationId: "org-a",
      learnerId: "lrn-a",
    })
    expect(repository.calls[0]?.scope.organizationId).not.toBe("org-forged")
    expect(repository.calls[0]?.scope.learnerId).not.toBe("lrn-forged")
  })

  it("keeps bindOwnedGoalSkill free of infrastructure and server stacks", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/bind-owned-goal-skill.ts"),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
