import { and, eq } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { DomainError } from "../../modules/shared/index.js"
import type { EvidenceSkillRepository } from "../../modules/skills/index.js"
import { createEvidenceSkillAttribution } from "../../modules/skills/index.js"
import {
  evidence,
  evidenceSkills,
  goals,
  learningPaths,
  learningPathSteps,
  skills,
  stepSkills,
} from "./schema.js"
import * as schema from "./schema.js"

const NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

export function createDrizzleEvidenceSkillRepository(
  db: PostgresJsDatabase<typeof schema>,
): EvidenceSkillRepository {
  return {
    async bindOwned(evidenceId, skillId, scope) {
      return db.transaction(async (tx) => {
        const owned = await tx
          .select({
            evidenceId: evidence.id,
            stepId: evidence.stepId,
          })
          .from(evidence)
          .innerJoin(learningPathSteps, eq(evidence.stepId, learningPathSteps.id))
          .innerJoin(learningPaths, eq(learningPathSteps.pathId, learningPaths.id))
          .innerJoin(goals, eq(learningPaths.goalId, goals.id))
          .where(
            and(
              eq(evidence.id, evidenceId),
              eq(goals.organizationId, scope.organizationId),
              eq(goals.learnerId, scope.learnerId),
            ),
          )
        if (!owned[0]) {
          throw NOT_FOUND
        }

        const skillRows = await tx
          .select({ id: skills.id })
          .from(skills)
          .where(and(eq(skills.id, skillId), eq(skills.organizationId, scope.organizationId)))
        if (!skillRows[0]) {
          throw NOT_FOUND
        }

        const covered = await tx
          .select({ skillId: stepSkills.skillId })
          .from(stepSkills)
          .where(
            and(eq(stepSkills.stepId, owned[0].stepId), eq(stepSkills.skillId, skillRows[0].id)),
          )
        if (!covered[0]) {
          throw NOT_FOUND
        }

        const attribution = createEvidenceSkillAttribution({
          evidenceId: owned[0].evidenceId,
          skillId: covered[0].skillId,
        })

        await tx
          .insert(evidenceSkills)
          .values({
            evidenceId: attribution.evidenceId,
            skillId: attribution.skillId,
          })
          .onConflictDoNothing({
            target: [evidenceSkills.evidenceId, evidenceSkills.skillId],
          })

        const persisted = await tx
          .select()
          .from(evidenceSkills)
          .where(
            and(
              eq(evidenceSkills.evidenceId, attribution.evidenceId),
              eq(evidenceSkills.skillId, attribution.skillId),
            ),
          )
        if (!persisted[0]) {
          throw new Error("Owned evidence skill bind did not persist")
        }

        return createEvidenceSkillAttribution({
          evidenceId: persisted[0].evidenceId,
          skillId: persisted[0].skillId,
        })
      })
    },
  }
}
