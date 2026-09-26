import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import type { StepSkillRepository } from "../../modules/skills/index.js"
import { bindStepSkillCoverage, type OrganizationSkill } from "../../modules/skills/index.js"
import { goals, learningPaths, learningPathSteps, skills, stepSkills } from "./schema.js"
import * as schema from "./schema.js"

const NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

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

export function createDrizzleStepSkillRepository(
  db: PostgresJsDatabase<typeof schema>,
): StepSkillRepository {
  return {
    async bindOwned(stepId, skillId, scope) {
      return db.transaction(async (tx) => {
        const owned = await tx
          .select({ id: learningPathSteps.id })
          .from(learningPathSteps)
          .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
          .innerJoin(goals, eq(learningPaths.goalId, goals.id))
          .where(
            and(
              eq(learningPathSteps.id, stepId),
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

        const coverage = bindStepSkillCoverage({
          stepId: owned[0].id,
          skill: toOrganizationSkill(skillRows[0]),
          trustedOrganizationId: scope.organizationId,
        })

        await tx
          .insert(stepSkills)
          .values({
            stepId: coverage.stepId,
            skillId: coverage.skillId,
          })
          .onConflictDoNothing({
            target: [stepSkills.stepId, stepSkills.skillId],
          })

        return coverage
      })
    },
  }
}
