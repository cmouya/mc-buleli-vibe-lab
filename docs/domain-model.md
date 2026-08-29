# Modèle de domaine — Learnova

Ce document décrit le **modèle métier cible** de Learnova. Le Prototype 0 n’implémente qu’une sous-partie ; les concepts ci-dessous guident l’évolution vers Learnova 1.0.

---

## Vue d’ensemble des relations

```
Learner ── expresses ──► Goal
Goal ── decomposed into ──► Skill(s)
Skill(s) ── organized as ──► LearningPath ── contains ──► PathStep(s)
PathStep ── delivers ──► LearningActivity
LearningActivity ── assessed by ──► Assessment
Assessment ── produces ──► Evidence
Evidence ── informs ──► Mastery / CompetencyState
Events & Insights ── drive ──► Adaptation ──► NextBestAction
```

---

## Learner

### Responsabilité

Représente la personne qui apprend. Porte l’identité (future), le profil, les préférences et l’état de session courant.

### Attributs principaux

- `id` — identifiant unique (futur ; absent Prototype 0)
- `profile` — `LearnerProfile`
- `preferences` — `LearningPreferences`
- `activeGoalId` — objectif courant (futur)
- `createdAt`, `updatedAt`

### Relations

- 1 Learner → N Goals (historique, futur)
- 1 Learner → 1 LearnerState actif (session / parcours en cours)
- 1 Learner → N LearningEvents

### Règles métier

- Un apprenant peut avoir un seul **parcours actif** principal à la fois (Prototype 0).
- La modification d’objectif réinitialise le parcours associé (Prototype 0 : `setProfile()` efface `steps`).

---

## Goal

### Responsabilité

Destination d’apprentissage exprimée par l’apprenant. Point d’entrée du GPS des compétences.

### Attributs principaux

- `id`
- `statement` — texte libre de l’objectif
- `level` — niveau déclaré (débutant, intermédiaire, avancé)
- `hoursPerWeek` — rythme disponible
- `intent` — professionnel, personnel, académique
- `status` — draft | analyzed | confirmed | achieved
- `analyzedAt`, `confirmedAt`

### Relations

- 1 Goal → 1 LearningPath (généré)
- 1 Goal → N Skills cibles (via path ou analyse)

### Règles métier

- Un objectif doit être **non vide** et **confirmé** avant génération de parcours.
- L’analyse d’objectif produit une **interprétation** (future Goal Engine) — Prototype 0 simule via délai UX.

---

## Skill

### Responsabilité

Unité de capacité observable, réutilisable dans un référentiel. Brique du Skill Graph (vision).

### Attributs principaux

- `id`
- `name` — ex. « Culture IA », « Diagnostic e-mail »
- `description`
- `domain` — domaine métier (optionnel)
- `prerequisites` — ids de skills prérequis (vision graphe)

### Relations

- N Skills ↔ N PathSteps
- 1 Skill → N CompetencyStates (par apprenant)

### Règles métier

- Une compétence est **acquise** uniquement via Evidence validée — pas par consommation de contenu seule.

---

## Competency / CompetencyState

### Responsabilité

**Competency** : référentiel (définition).  
**CompetencyState** : état de maîtrise d’un apprenant pour une compétence donnée.

### Attributs principaux (CompetencyState)

- `skillId`
- `learnerId`
- `masteryLevel` — none | emerging | proficient | expert (échelle cible)
- `evidenceIds[]`
- `lastAssessedAt`

### Relations

- Lié à `Mastery` (agrégat ou projection)
- Alimenté par `Evidence`

### Règles métier

- **Progress ≠ Mastery** : compléter une étape avance le path ; le niveau de maîtrise dépend des preuves et critères.
- Prototype 0 : `skills[]` = liste de noms validés — **progression simplifiée**, pas mastery score.

---

## LearningPath

### Responsabilité

Itinéraire personnalisé menant de l’état actuel de l’apprenant vers son objectif.

### Attributs principaux

- `id` / `pathId`
- `goalId`
- `title`
- `summary`
- `steps[]` — `PathStep[]`
- `status` — draft | active | completed | abandoned
- `generatedAt`
- `generatorMode` — mock | ai | manual

### Relations

- 1 LearningPath → 1 Goal
- 1 LearningPath → N PathSteps (ordonnés)

### Règles métier

- Génération déclenchée une fois l’objectif confirmé.
- Prototype 0 : pas de régénération si path existe (`hasPath()` guard dans `bindRoadmap`).

---

## PathStep

### Responsabilité

Étape atomique du parcours, associée à une compétence et une activité d’apprentissage.

### Attributs principaux

- `id`
- `pathId`
- `order` — position (1-based)
- `title`, `description`
- `skillId` / `skill` (label Prototype 0)
- `level`, `duration`
- `status` — `todo` | `current` | `done`
- `activityId` (lien vers content, futur)

### Relations

- N PathSteps → 1 LearningPath
- 1 PathStep → 0..1 LearningActivity
- 1 PathStep → 0..N Assessments / Evidence

### Règles métier

- Ordre **séquentiel strict** en Prototype 0 : une seule étape `current`.
- Passage à `done` **uniquement** après validation assessment (Evidence + seuil).
- Étape `todo` **inaccessible** en leçon (Prototype 0 : message verrouillage).

---

## LearningActivity

### Responsabilité

Unité pédagogique consommable : micro-learning, exercice, projet, etc.

### Attributs principaux

- `id`
- `stepId`
- `title`
- `introduction`
- `concepts[]`
- `example` (optionnel)
- `takeaway`
- `format` — micro-lesson | exercise | project | …
- `estimatedDuration`

### Relations

- 1 LearningActivity → 1 PathStep (typiquement)
- 1 LearningActivity → 1..N Assessments

### Règles métier

- Contenu **ancré** dans l’objectif et la compétence de l’étape.
- Prototype 0 : contenu statique `lessons.js` ou `buildFallbackLesson()`.

---

## Assessment

### Responsabilité

Mécanisme d’évaluation lié à une activité ou étape : quiz, exercice noté, critères.

### Attributs principaux

- `id`
- `activityId` / `stepId`
- `type` — quiz | practical | self-assessment | …
- `questions[]`
- `passThreshold` — ex. 2/3
- `maxAttempts` (optionnel, futur)

### Relations

- 1 Assessment → N Evidence (une par tentative)

### Règles métier

- Score calculé côté domaine, pas côté UI seule.
- Seuil défini par **règles domaine** (principe : AI assists, Rules decide).
- Prototype 0 : seuil `passScore: 2` sur 3 questions.

---

## Evidence

### Responsabilité

Preuve tangible d’apprentissage produite par un assessment ou une activité.

### Attributs principaux

- `id`
- `learnerId`
- `stepId`
- `assessmentId`
- `type` — quiz_attempt | submission | observation
- `score`, `maxScore`
- `passed` — boolean
- `answers[]` — détail des réponses
- `recordedAt`

### Relations

- N Evidence → 1 Assessment
- Evidence → alimente CompetencyState / Mastery

### Règles métier

- **Evidence before Completion** : pas de `PathStep.status = done` sans Evidence `passed = true`.
- Prototype 0 : evidence **implicite** (pas persistée séparément) — dette à combler.

---

## Mastery

### Responsabilité

Niveau de maîtrise **évalué** d’une compétence pour un apprenant — distinct de la progression sur le path.

### Attributs principaux

- `skillId`
- `learnerId`
- `level` — none | emerging | proficient | expert
- `confidence` — 0..1 (optionnel)
- `basedOnEvidenceIds[]`
- `evaluatedAt`

### Relations

- Agrège plusieurs Evidence
- Différent de `getProgressPercent()`

### Règles métier

- Ne pas inférer mastery depuis `%` du parcours.
- Peut exiger plusieurs preuves ou réévaluations (vision).
- Prototype 0 : **non implémenté** — `skills[]` = proxy simpliste.

---

## LearningEvent

### Responsabilité

Événement du cycle de vie d’apprentissage, pour analytics et adaptation.

### Exemples

- `goal_submitted`, `path_generated`, `step_started`, `quiz_submitted`, `step_validated`, `step_failed`

### Attributs principaux

- `id`, `learnerId`, `type`, `payload`, `timestamp`

### Règles métier

- Immutable une fois enregistré.
- Prototype 0 : **non implémenté** — pas de event log.

---

## LearningInsight

### Responsabilité

Interprétation dérivée des events et evidence : lacunes, forces, tendances.

### Exemples

- « Lacune sur gouvernance IA »
- « Bon score quiz mais temps de réponse élevé »

### Relations

- Produits par module `analytics`
- Alimentent Adaptation et NextBestAction

---

## NextBestAction

### Responsabilité

Recommandation explicite de la prochaine action optimale pour l’apprenant.

### Attributs principaux

- `type` — continue_step | retry_quiz | remediation | review | …
- `targetStepId` / `targetActivityId`
- `rationale` — explication (explainability)
- `priority`

### Relations

- Consomme LearningInsights + état path
- Prototype 0 : CTA « Continuer mon parcours » / « Continuer vers l’étape N » — **règle fixe**, pas moteur d’adaptation.

---

## Progress vs Mastery — distinction formelle

| Dimension | Progress | Mastery |
|-----------|----------|---------|
| **Question** | Où suis-je sur l’itinéraire ? | Quel niveau ai-je sur cette compétence ? |
| **Mesure** | Étapes `done` / total | Niveau + preuves |
| **Prototype 0** | `getProgressPercent()` | `skills[]` (liste noms) |
| **Risque** | Confondre 100 % path avec expertise | Valider mastery sans evidence suffisante |
| **UI** | Barre %, track GPS | Profil compétences, badges (futur) |

---

## Correspondance Prototype 0

| Concept domaine | Implémentation actuelle |
|-----------------|-------------------------|
| Learner | `store.js` état global |
| Goal | `state.goal`, `analyzed`, profil |
| LearningPath | `pathId`, `pathTitle`, `steps[]` |
| PathStep | éléments de `steps[]` |
| Skill | `step.skill`, `skills[]` |
| LearningActivity | `lessons.js` + rendu `lesson.js` |
| Assessment | quiz dans `lesson.js` |
| Evidence | implicite (non persisté) |
| Mastery | non modélisé |
| LearningEvent | absent |
| NextBestAction | liens CTA statiques |
