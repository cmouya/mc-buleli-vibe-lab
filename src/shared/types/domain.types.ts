/**
 * Learnova — Core domain contracts (Phase 0)
 *
 * Initial domain contracts. Not imported by the JavaScript prototype runtime.
 * @module shared/types/domain
 */

import type { GoalIntent, LearnerLevel, PathStepStatus } from "./learner.types.js"

/** Statut du cycle de vie d'un objectif */
export type GoalStatus = "draft" | "analyzed" | "confirmed" | "achieved"

/**
 * Objectif d'apprentissage — destination de l'apprenant
 */
export interface Goal {
  id?: string
  statement: string
  level: LearnerLevel
  hoursPerWeek: number
  intent: GoalIntent
  status: GoalStatus
  analyzedAt?: string
  confirmedAt?: string
}

/**
 * Compétence référentielle (Skill Graph — vision)
 */
export interface Skill {
  id: string
  name: string
  description?: string
  domain?: string
  prerequisiteIds?: string[]
}

/** Niveau de maîtrise évalué (distinct de PathStepStatus) */
export type MasteryLevel = "none" | "emerging" | "proficient" | "expert"

/**
 * État de compétence d'un apprenant pour une skill donnée
 */
export interface CompetencyState {
  skillId: string
  learnerId?: string
  masteryLevel: MasteryLevel
  evidenceIds: string[]
  lastAssessedAt?: string
}

/** Statut du parcours */
export type LearningPathStatus = "draft" | "active" | "completed" | "abandoned"

/** Mode de génération du parcours */
export type PathGeneratorMode = "mock" | "ai" | "manual"

/**
 * Parcours d'apprentissage — GPS des compétences
 */
export interface LearningPath {
  id: string
  goalId?: string
  title: string
  summary?: string
  steps: PathStep[]
  status: LearningPathStatus
  generatedAt?: string
  generatorMode: PathGeneratorMode
}

/**
 * Étape du parcours
 */
export interface PathStep {
  id: string
  pathId?: string
  order: number
  title: string
  description: string
  skillId?: string
  skill?: string
  level: string
  duration: string
  status: PathStepStatus
  activityId?: string
}

/** Type d'assessment */
export type AssessmentType = "quiz" | "practical" | "self_assessment" | "project"

/**
 * Question de quiz
 */
export interface AssessmentQuestion {
  id?: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

/**
 * Assessment — mécanisme d'évaluation
 */
export interface Assessment {
  id?: string
  stepId: string
  activityId?: string
  type: AssessmentType
  questions: AssessmentQuestion[]
  passThreshold: number
  maxAttempts?: number
}

/** Type de preuve */
export type EvidenceType = "quiz_attempt" | "submission" | "observation"

/**
 * Réponse individuelle dans une preuve
 */
export interface EvidenceAnswer {
  questionIndex: number
  selectedIndex: number
  correct: boolean
}

/**
 * Evidence — preuve d'apprentissage (Evidence before Completion)
 */
export interface Evidence {
  id?: string
  learnerId?: string
  stepId: string
  assessmentId?: string
  type: EvidenceType
  score: number
  maxScore: number
  passed: boolean
  answers: EvidenceAnswer[]
  recordedAt: string
}

/**
 * Mastery — maîtrise évaluée (Progress ≠ Mastery)
 */
export interface Mastery {
  skillId: string
  learnerId?: string
  level: MasteryLevel
  confidence?: number
  basedOnEvidenceIds: string[]
  evaluatedAt: string
}

/**
 * Résultat de validation domaine post-assessment
 */
export interface ValidationResult {
  passed: boolean
  score: number
  maxScore: number
  threshold: number
  rationale: string
}
