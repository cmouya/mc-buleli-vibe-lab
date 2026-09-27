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
  RequiredProficiency,
} from "../../../src/modules/skills/index.js"

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function memoryBinds(): GoalSkillRepository & {
  calls: Array<{
    goalId: string
    skillId: string
    requiredLevel: RequiredProficiency
    scope: GoalOwnerScope
  }>
} {
  const calls: Array<{
    goalId: string
    skillId: string
    requiredLevel: RequiredProficiency
    scope: GoalOwnerScope
  }> = []
  return {
    calls,
    async bindOwned(goalId, skillId, requiredLevel, scope) {
      calls.push({ goalId, skillId, requiredLevel, scope })
      const pair: GoalSkillRequirement = { goalId, skillId, requiredLevel }
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
        requiredLevel: "proficient",
        organizationId: "org-forged",
        learnerId: "lrn-forged",
      },
      contextA(),
      repository,
    )
    expect(result).toEqual({ goalId: "goal-1", skillId: "skill-1", requiredLevel: "proficient" })
    expect(repository.calls).toHaveLength(1)
    expect(repository.calls[0]?.requiredLevel).toBe("proficient")
    expect(repository.calls[0]?.scope).toEqual({
      organizationId: "org-a",
      learnerId: "lrn-a",
    })
    expect(repository.calls[0]?.scope.organizationId).not.toBe("org-forged")
    expect(repository.calls[0]?.scope.learnerId).not.toBe("lrn-forged")
  })

  it("rejects invalid requiredLevel before persistence", async () => {
    const repository = memoryBinds()
    await expect(
      bindOwnedGoalSkill(
        { goalId: "goal-1", skillId: "skill-1", requiredLevel: "none" },
        contextA(),
        repository,
      ),
    ).rejects.toMatchObject({ code: "GOAL_SKILL_INVALID_REQUIRED_LEVEL" })
    expect(repository.calls).toHaveLength(0)
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
