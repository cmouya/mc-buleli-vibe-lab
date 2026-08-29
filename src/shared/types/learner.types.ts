/**
 * Learnova — Learner domain contracts (Phase 0)
 *
 * Initial domain contracts. Not imported by the JavaScript prototype runtime.
 * @module shared/types/learner
 */

/** Niveau déclaré par l'apprenant */
export type LearnerLevel = "debutant" | "intermediaire" | "avance"

/** Intention / contexte de l'objectif */
export type GoalIntent = "professionnel" | "personnel" | "academique"

/**
 * Profil apprenant — données relativement stables
 */
export interface LearnerProfile {
  /** Identifiant unique (futur ; absent Prototype 0) */
  id?: string
  /** Niveau de départ déclaré */
  level: LearnerLevel
  /** Heures disponibles par semaine */
  hoursPerWeek: number
  /** Type d'intention dominante */
  intent: GoalIntent
  /** Objectif textuel courant */
  goal: string
  /** Objectif analysé / confirmé par le flux Goal */
  analyzed: boolean
}

/**
 * Préférences d'apprentissage (extension future)
 */
export interface LearningPreferences {
  /** Langue d'interface préférée */
  locale?: string
  /** Formats privilégiés : micro-lesson, video, project, … */
  preferredFormats?: string[]
  /** Notifications activées */
  notificationsEnabled?: boolean
}

/**
 * Statut d'une étape dans le parcours (Prototype 0)
 */
export type PathStepStatus = "todo" | "current" | "done"

/**
 * Étape de parcours — alignée sur store.js Prototype 0
 */
export interface PathStepSnapshot {
  id: string
  title: string
  description: string
  level: string
  duration: string
  skill?: string
  status: PathStepStatus
}

/**
 * État de session / parcours apprenant — aligné sur localStorage `learnova-learner`
 */
export interface LearnerState {
  profile: LearnerProfile
  /** Identifiant du parcours généré */
  pathId: string
  /** Titre du parcours */
  pathTitle: string
  /** Étapes du GPS */
  steps: PathStepSnapshot[]
  /** Compétences validées (noms — proxy simplifié, pas Mastery) */
  skills: string[]
  /** Horodatage dernière mutation */
  updatedAt: string | null
}

/**
 * Apprenant — agrégat racine (vision cible)
 */
export interface Learner {
  profile: LearnerProfile
  preferences: LearningPreferences
  /** État de parcours actif */
  state: LearnerState
}
