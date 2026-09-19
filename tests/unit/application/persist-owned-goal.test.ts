import { describe, expect, it } from "vitest"
import { getOwnedGoal, persistOwnedGoal } from "../../../src/application/persist-owned-goal.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import type { Goal, OwnedGoalRepository } from "../../../src/modules/goals/index.js"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const fields = {
  statement: "Maîtriser Outlook",
  level: "debutant" as const,
  hoursPerWeek: 5,
  intent: "professionnel" as const,
}

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function contextB(): LearnerContext {
  return { learnerId: "lrn-b", userId: "user-u", organizationId: "org-b" }
}

function contextA2(): LearnerContext {
  return { learnerId: "lrn-a2", userId: "user-2", organizationId: "org-a" }
}

function memoryOwned(): OwnedGoalRepository & { rows: Goal[] } {
  const rows: Goal[] = []
  return {
    rows,
    async saveOwned(goal, scope) {
      const owned: Goal = {
        ...goal,
        organizationId: scope.organizationId,
        learnerId: scope.learnerId,
      }
      rows.push(owned)
      return owned
    },
    async getOwnedById(goalId, scope) {
      return (
        rows.find(
          (goal) =>
            goal.id === goalId &&
            goal.organizationId === scope.organizationId &&
            goal.learnerId === scope.learnerId,
        ) ?? null
      )
    },
  }
}

describe("application — persistOwnedGoal / getOwnedGoal", () => {
  it("stamps ownership from LearnerContext and ignores client ownership fields", async () => {
    const repository = memoryOwned()
    const saved = await persistOwnedGoal(
      {
        ...fields,
        organizationId: "org-forged",
        learnerId: "lrn-forged",
      },
      contextA(),
      repository,
    )
    expect(saved.organizationId).toBe("org-a")
    expect(saved.learnerId).toBe("lrn-a")
    expect(saved.organizationId).not.toBe("org-forged")
    expect(saved.learnerId).not.toBe("lrn-forged")
    expect(await getOwnedGoal(saved.id as string, contextA(), repository)).toEqual(saved)
  })

  it("does not return a Goal to another organization or another learner", async () => {
    const repository = memoryOwned()
    const owned = await persistOwnedGoal(fields, contextA(), repository)
    expect(await getOwnedGoal(owned.id as string, contextB(), repository)).toBeNull()
    expect(await getOwnedGoal(owned.id as string, contextA2(), repository)).toBeNull()
    expect(await getOwnedGoal("00000000-0000-4000-8000-000000000000", contextA(), repository)).toBeNull()
  })

  it("isolates two Goals for the same user in different organizations", async () => {
    const repository = memoryOwned()
    const goalA = await persistOwnedGoal({ ...fields, statement: "Goal A" }, contextA(), repository)
    const goalB = await persistOwnedGoal({ ...fields, statement: "Goal B" }, contextB(), repository)
    expect(await getOwnedGoal(goalA.id as string, contextA(), repository)).toEqual(goalA)
    expect(await getOwnedGoal(goalB.id as string, contextB(), repository)).toEqual(goalB)
    expect(await getOwnedGoal(goalA.id as string, contextB(), repository)).toBeNull()
    expect(await getOwnedGoal(goalB.id as string, contextA(), repository)).toBeNull()
  })

  it("does not treat unowned legacy Goals as owned", async () => {
    const repository = memoryOwned()
    repository.rows.push({
      id: "legacy",
      statement: "Legacy",
      level: "debutant",
      hoursPerWeek: 4,
      intent: "personnel",
      status: "draft",
    })
    expect(await getOwnedGoal("legacy", contextA(), repository)).toBeNull()
  })

  it("keeps persist-owned-goal free of infrastructure stacks", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../src/application/persist-owned-goal.ts"),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
    expect(source).not.toMatch(/getById\(/)
  })
})
