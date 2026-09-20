/**
 * Derive owned Step Completion and Path Progress from persisted owned Evidence.
 * Uses I-05 (assertEvidenceAllowsCompletion) without mutating state.
 * Client organizationId/learnerId never override LearnerContext.
 */

import { DomainError } from "../modules/shared/index.js"
import { evidenceAllowsCompletion, type Evidence } from "../modules/evidence/index.js"
import type { OwnedProgressRepository } from "../modules/evidence/index.js"
import type { OwnedDerivedContentRepository } from "../modules/learning-path/index.js"
import type { LearnerContext } from "./resolve-learner-context.js"
import { getOwnedPath, getOwnedStep } from "./get-owned-derived-content.js"

export type { OwnedProgressRepository }

export interface OwnedPathProgress {
  totalSteps: number
  completedSteps: number
  progressPercent: number
}

export interface OwnedStepCompletion {
  stepId: string
  complete: boolean
}

const NOT_FOUND = new DomainError("RESOURCE_NOT_FOUND", "Not found")

function scopeOf(context: LearnerContext) {
  return {
    organizationId: context.organizationId,
    learnerId: context.learnerId,
  }
}

function stepIsComplete(stepId: string, evidence: Evidence[]): boolean {
  return evidence.some((item) => evidenceAllowsCompletion(item, stepId))
}

function progressPercent(totalSteps: number, completedSteps: number): number {
  if (totalSteps === 0) {
    return 0
  }
  return Math.round((completedSteps / totalSteps) * 100)
}

export async function getOwnedStepCompletion(
  stepId: string,
  goalId: string,
  context: LearnerContext,
  derived: OwnedDerivedContentRepository,
  progress: OwnedProgressRepository,
): Promise<OwnedStepCompletion> {
  const step = await getOwnedStep(stepId, goalId, context, derived)
  if (!step?.id) {
    throw NOT_FOUND
  }

  const evidence = await progress.listOwnedEvidenceForStep(step.id, goalId, scopeOf(context))
  return {
    stepId: step.id,
    complete: stepIsComplete(step.id, evidence),
  }
}

export async function getOwnedPathProgress(
  goalId: string,
  context: LearnerContext,
  derived: OwnedDerivedContentRepository,
  progress: OwnedProgressRepository,
): Promise<OwnedPathProgress> {
  const path = await getOwnedPath(goalId, context, derived)
  if (!path || path.goalId !== goalId) {
    throw NOT_FOUND
  }

  const steps = path.steps.filter((step) => Boolean(step.id))
  let completedSteps = 0
  for (const step of steps) {
    const evidence = await progress.listOwnedEvidenceForStep(step.id, goalId, scopeOf(context))
    if (stepIsComplete(step.id, evidence)) {
      completedSteps += 1
    }
  }

  const totalSteps = steps.length
  return {
    totalSteps,
    completedSteps,
    progressPercent: progressPercent(totalSteps, completedSteps),
  }
}