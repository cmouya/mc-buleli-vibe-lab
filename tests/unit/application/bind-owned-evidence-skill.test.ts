import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { bindOwnedEvidenceSkill } from "../../../src/application/bind-owned-evidence-skill.js"
import type { LearnerContext } from "../../../src/application/resolve-learner-context.js"
import { DomainError } from "../../../src/modules/shared/index.js"
import type { GoalOwnerScope } from "../../../src/modules/goals/index.js"
import type {
  EvidenceSkillAttribution,
  EvidenceSkillRepository,
} from "../../../src/modules/skills/index.js"

function contextA(): LearnerContext {
  return { learnerId: "lrn-a", userId: "user-u", organizationId: "org-a" }
}

function memoryBinds(): EvidenceSkillRepository & {
  calls: Array<{ evidenceId: string; skillId: string; scope: GoalOwnerScope }>
} {
  const calls: Array<{ evidenceId: string; skillId: string; scope: GoalOwnerScope }> = []
  return {
    calls,
    async bindOwned(evidenceId, skillId, scope) {
      calls.push({ evidenceId, skillId, scope })
      const pair: EvidenceSkillAttribution = { evidenceId, skillId }
      return pair
    },
  }
}

describe("application — bindOwnedEvidenceSkill", () => {
  it("delegates using LearnerContext and ignores forged tenant fields", async () => {
    const repository = memoryBinds()
    const result = await bindOwnedEvidenceSkill(
      {
        evidenceId: "ev-1",
        skillId: "skill-1",
        organizationId: "org-forged",
        learnerId: "lrn-forged",
      },
      contextA(),
      repository,
    )
    expect(result).toEqual({ evidenceId: "ev-1", skillId: "skill-1" })
    expect(repository.calls).toHaveLength(1)
    expect(repository.calls[0]?.evidenceId).toBe("ev-1")
    expect(repository.calls[0]?.skillId).toBe("skill-1")
    expect(repository.calls[0]?.scope).toEqual({
      organizationId: "org-a",
      learnerId: "lrn-a",
    })
    expect(repository.calls[0]?.scope.organizationId).not.toBe("org-forged")
    expect(repository.calls[0]?.scope.learnerId).not.toBe("lrn-forged")
  })

  it("does not expand one Skill into every Step Skill", async () => {
    const repository = memoryBinds()
    await bindOwnedEvidenceSkill({ evidenceId: "ev-1", skillId: "skill-1" }, contextA(), repository)
    expect(repository.calls).toEqual([
      {
        evidenceId: "ev-1",
        skillId: "skill-1",
        scope: { organizationId: "org-a", learnerId: "lrn-a" },
      },
    ])
  })

  it("rejects empty ids before persistence", async () => {
    const repository = memoryBinds()
    await expect(
      bindOwnedEvidenceSkill({ evidenceId: " ", skillId: "skill-1" }, contextA(), repository),
    ).rejects.toBeInstanceOf(DomainError)
    await expect(
      bindOwnedEvidenceSkill({ evidenceId: "ev-1", skillId: " " }, contextA(), repository),
    ).rejects.toBeInstanceOf(DomainError)
    expect(repository.calls).toEqual([])
  })

  it("keeps bindOwnedEvidenceSkill free of infrastructure and server stacks", () => {
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../../src/application/bind-owned-evidence-skill.ts",
      ),
      "utf8",
    )
    expect(source).not.toMatch(/drizzle-orm/)
    expect(source).not.toMatch(/fastify/i)
    expect(source).not.toMatch(/from ["']\.\.\/infra\//)
    expect(source).not.toMatch(/from ["']\.\.\/server\//)
  })
})
