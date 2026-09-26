import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import type { GoalSkillRepository } from "../../modules/skills/index.js"
import { bindGoalSkillRequirement, type OrganizationSkill } from "../../modules/skills/index.js"
import { goalSkills, goals, skills } from "./schema.js"
import * as schema from "./schema.js"

const NOT_FOUND = new DomainError("GOAL_NOT_FOUND", "Goal not found")

function toOrganizationSkill(row: typeof skills.$inferSelect): OrganizationSkill {
  const skill: OrganizationSkill = {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
  }
  if (row.description != null) {
    skill.description = row.description
  }
  return skill
}

export function createDrizzleGoalSkillRepository(
  db: PostgresJsDatabase<typeof schema>,
): GoalSkillRepository {
  return {
    async bindOwned(goalId, skillId, scope) {
      return db.transaction(async (tx) => {
        const owned = await tx
          .select({ id: goals.id })
          .from(goals)
          .where(
            and(
              eq(goals.id, goalId),
              eq(goals.organizationId, scope.organizationId),
              eq(goals.learnerId, scope.learnerId),
            ),
          )
        if (!owned[0]) {
          throw NOT_FOUND
        }

        const skillRows = await tx
          .select()
          .from(skills)
          .where(and(eq(skills.id, skillId), eq(skills.organizationId, scope.organizationId)))
        if (!skillRows[0]) {
          throw NOT_FOUND
        }

        const requirement = bindGoalSkillRequirement({
          goalId: owned[0].id,
          skill: toOrganizationSkill(skillRows[0]),
          goalOrganizationId: scope.organizationId,
        })

        await tx
          .insert(goalSkills)
          .values({
            goalId: requirement.goalId,
            skillId: requirement.skillId,
          })
          .onConflictDoNothing({
            target: [goalSkills.goalId, goalSkills.skillId],
          })

        return requirement
      })
    },
  }
}
