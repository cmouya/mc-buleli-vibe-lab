# Learnova — Architecture Baseline

**Version :** Phase 2.1-B  
**Date :** 2026-09-03  
**Statut document :** BASELINE READY FOR HUMAN VALIDATION

---

## Table des matières

1. [Purpose & Scope](#1-purpose--scope)
2. [Product & Architectural Context](#2-product--architectural-context)
3. [Current State](#3-current-state)
4. [Target Architecture](#4-target-architecture)
5. [Architectural Principles](#5-architectural-principles)
6. [Domain Architecture](#6-domain-architecture)
7. [MVP Domain Boundaries](#7-mvp-domain-boundaries)
8. [Domain Invariants](#8-domain-invariants)
9. [AI Architecture & Governance](#9-ai-architecture--governance)
10. [Security & Multi-tenancy](#10-security--multi-tenancy)
11. [Data Architecture](#11-data-architecture)
12. [API Architecture](#12-api-architecture)
13. [Authentication & Session Architecture](#13-authentication--session-architecture)
14. [Observability, Domain Events & Audit](#14-observability-domain-events--audit)
15. [Testing Strategy](#15-testing-strategy)
16. [Migration Baseline](#16-migration-baseline)
17. [Migration Stages](#17-migration-stages)
18. [First Vertical Slice](#18-first-vertical-slice)
19. [Engineering Constitution](#19-engineering-constitution)
20. [Architecture Decision Records](#20-architecture-decision-records)
21. [ADR Coherence Matrix](#21-adr-coherence-matrix)
22. [Deferred Decisions](#22-deferred-decisions)
23. [Architectural Change Process](#23-architectural-change-process)
24. [Phase 2.2 Entry Criteria](#24-phase-22-entry-criteria)
25. [Architecture Baseline Status](#25-architecture-baseline-status)

---

## 1. Purpose & Scope

### Rôle du document

Ce document constitue la **baseline architecturale officielle** de Learnova pour la Phase 2. Il consolide les décisions validées lors de la Phase 2.1-B (Architecture Baseline & Decision Record) et sert de référence unique pour toutes les phases d’implémentation futures.

### Périmètre

| Inclus | Exclu |
|--------|-------|
| Vision produit et contexte architectural | Spécifications UI détaillées |
| État actuel du prototype (Golden Reference) + persistance M4 | Catalogue exhaustif du schéma MVP (org, mastery, …) |
| Architecture cible validée | Catalogue exhaustif d’endpoints API |
| Principes, invariants et ADR | Implémentation de code |
| Frontières MVP / V1.1 / V2 | Décisions non encore validées |

### Documents connexes

- [`docs/vision.md`](vision.md) — Vision produit
- [`docs/domain-model.md`](domain-model.md) — Modèle de domaine
- [`docs/product-principles.md`](product-principles.md) — Principes non négociables
- [`docs/architecture.md`](architecture.md) — État des lieux Prototype 0 (historique)
- [`docs/migration-map.md`](migration-map.md) — Matrice de migration fichier par fichier
- [`docs/m5-auth-tenancy-plan.md`](m5-auth-tenancy-plan.md) — Brief M5 historique **non contraignant**
- [`docs/m5-decisions.md`](m5-decisions.md) — Décisions M5 enregistrées (audit §22)
- [`docs/m5.1-identity-island.md`](m5.1-identity-island.md) — M5.1 identity island (**Done**)
- [`docs/m5.2-decisions.md`](m5.2-decisions.md) — Décisions M5.2 (humain) ; [`docs/m5.2-implementation-plan.md`](m5.2-implementation-plan.md) — M5.2 sessions (**Done**)
- [`docs/m5.3-decisions.md`](m5.3-decisions.md) — Décisions M5.3 (humain) ; [`docs/m5.3-implementation-plan.md`](m5.3-implementation-plan.md) — M5.3 tenant isolation (**Done**)
- [`docs/m6.1-decisions.md`](m6.1-decisions.md) — Décisions M6.1 (humain) ; [`docs/m6.1-implementation-plan.md`](m6.1-implementation-plan.md) — M6.1 Learner + Goal ownership (**COMPLETE AND VALIDATED**)
- [`docs/m6.2-decisions.md`](m6.2-decisions.md) — Décisions M6.2 (humain) ; [`docs/m6.2-implementation-plan.md`](m6.2-implementation-plan.md) — M6.2 owned Path persist (**ADR-017 Accepted** ; **COMPLETE AND VALIDATED**)
- [`docs/m6.3-decisions.md`](m6.3-decisions.md) — Décisions M6.3 (humain) ; [`docs/m6.3-implementation-plan.md`](m6.3-implementation-plan.md) — M6.3 owned Evidence persist (**ADR-018 Accepted** ; **COMPLETE AND VALIDATED** ; C1–C3 ; FINAL VALIDATION PASS ; 228 executable tests)
- Phase 1.5 — Référentiel stratégique et fonctionnel (personas, MVP, exigences)

### Distinction fondamentale

Ce document distingue explicitement :

- **État actuel** — ce qui existe et fonctionne aujourd’hui dans le dépôt
- **Architecture cible** — ce qui est décidé mais pas encore entièrement implémenté
- **Décision différée** — ce qui reste à définir ultérieurement

---

## 2. Product & Architectural Context

### Vision Learnova

Learnova est une **Learning Intelligence Platform** — pas un LMS traditionnel avec un chatbot. C’est un **GPS des compétences** orienté destination :

> Ne cherchez plus quel cours suivre. Dites-nous où vous voulez aller.

Source : [`docs/vision.md`](vision.md)

### Positionnement

| LMS traditionnel | Learnova |
|------------------|----------|
| « Quel cours voulez-vous ? » | « Quel objectif voulez-vous atteindre ? » |
| Catalogue centré contenu | Itinéraire centré destination |
| Progression = consommation | Progression = avancement + preuve |
| Complétion = terminé | Complétion = evidence + règles métier |

### Modèle économique (Phase 1.5)

Learnova vise un modèle **B2B SaaS** :

```
Organization → Programs → Cohorts → Learners
```

Chaque organisation constitue une frontière tenant. Les programmes empaquettent l’offre pédagogique ; les cohortes regroupent les apprenants dans le temps.

### Principe fondateur : Goal before Content

Aucune activité d’apprentissage n’est proposée sans être **justifiée par un objectif** et **rattachée à une compétence** sur un chemin explicite.

Source : [`docs/product-principles.md`](product-principles.md)

### Chaîne Learning Intelligence (architecture cible)

```
GOAL
  → SKILLS
  → LEARNER STATE
  → ADAPTIVE PATH
  → LEARNING
  → EVIDENCE
  → MASTERY
```

Cette chaîne est le noyau conceptuel de Learnova. Le prototype actuel en couvre une tranche simplifiée (voir section 3).

---

## 3. Current State

> **État actuel** — Golden Reference (Prototype 0) toujours en `localStorage`. M0–M4 sont **Done**. L’architecture cible (section 4) n’est **pas** entièrement déployée (auth, React, vertical slice).

### Stack runtime Golden Reference

| Couche | Technologie | Fichiers |
|--------|-------------|----------|
| Build | Vite 7 | `package.json`, `index.html` |
| UI | JavaScript vanilla, HTML strings | `src/views/*.js`, `src/style.css` |
| Routing | Hash router maison | `src/router.js` |
| État | Singleton module | `src/store.js` |
| Persistance UI | `localStorage` (`learnova-learner`) | `src/store.js` |
| IA | MockAIService (local, déterministe) | `src/ai/*` |
| Contenu | Leçons statiques | `src/data/lessons.js` |
| Logique quiz | Fonctions pures | `src/shared/assessment.js` |

### Plateforme serveur (M3–M4, Done)

| Couche | Technologie | Fichiers |
|--------|-------------|----------|
| API | Fastify + OpenAPI `/api/v1/` | `src/server/` |
| Use cases | Application TS | `src/application/` |
| Domain | Modules purs + ports repository | `src/modules/` |
| Persistance | PostgreSQL + Drizzle | `src/infra/db/`, `drizzle/` |

Chaîne durable (sans identité apprenant) :

`Goal → Accepted Learning Path → learning_path_steps → Evidence`

Les routes HTTP confirm/generate restent **stateless**. Les use cases `persist*` / `acceptLearningPath` existent mais **ne sont pas exposés** à l’API ni au Golden Reference. Pas de dual-write.

### Parcours utilisateur actif

```
Landing (#/)
  → Goal (#/goal)
  → Roadmap (#/roadmap)     [génération Mock AI]
  → Dashboard (#/dashboard)
  → Lesson (#/lesson)
  → Quiz → Validation → Progression
```

Source : [`README.md`](../README.md), [`src/main.js`](../src/main.js)

### Contrats TypeScript (Phase 0)

| Fichier | Contenu | Branché au runtime ? |
|---------|---------|---------------------|
| `src/shared/types/domain.types.ts` | Goal, Skill, Evidence, Mastery, Assessment… | **Non** |
| `src/shared/types/learner.types.ts` | LearnerProfile, LearnerState, PathStepSnapshot… | **Non** |

`tsconfig.json` scope : `src/shared/types/**/*.ts` — strict mode, `noEmit: true`.

### Tests et CI

| Suite | Outil | Volume | Rôle |
|-------|-------|--------|------|
| Unit / application | Vitest | 99 tests | Domaine, adapters, use cases, frontières |
| API | Vitest + Fastify `inject()` | 9 tests | health, confirm-goal, generate-path, OpenAPI |
| DB | Vitest + PostgreSQL | 9 tests | migrate, Goal, Path, Evidence |
| E2E | Playwright (Chromium) | 13 tests | Golden Reference |
| Typecheck / build | TypeScript, Vite | — | Contrats + bundle GR |
| CI | GitHub Actions | push/PR | typecheck → test → test:api → test:db → build → test:e2e |

Source : [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

### Limites connues (après M4)

| Limite | Impact |
|--------|--------|
| Pas d’auth / pas de tenant | M5 ; tables actuelles sans `user_id` / `organization_id` |
| Golden Reference = localStorage | Pas de sync UI ↔ PostgreSQL ; pas de dual-write |
| Persist HTTP absent | Goal/Path/Evidence durables hors API |
| Progress navigateur | `todo/current/done` et % restent dans `store.js` |
| Mastery non implémenté | Type seulement ; I-04 / M6 |
| Skill = string label au runtime | Modules Skill/LearnerSkill non branchés |
| Pas de diagnostic structuré | Intake limité au formulaire Goal |
| Mock AI template matching | Parcours non adaptatif au profil réel |
| Seed data produit | Non livré (sans identité, seed jetable) |

### Ce qui n’est PAS l’état actuel

Les éléments suivants restent **cible**, pas déployés :

- React (M7)
- Authentication, sessions, multi-tenancy, RBAC serveur (M5)
- Mastery persistée / calculée (M6)
- Vertical slice Organization → Mastery via API (M6)
- Progress / LearnerState / Skill persistés côté serveur

---

## 4. Target Architecture

> **Architecture cible** — Décisions validées Phase 2.1-B. Implémentation progressive (section 17).

### Stack cible

```
React + TypeScript + Vite
        ↓
REST + OpenAPI
        ↓
Fastify + TypeScript
        ↓
Application Layer
        ↓
Domain Layer
        ↓
Repository Interfaces
        ↓
Drizzle
        ↓
PostgreSQL
```

### Diagramme des couches

```mermaid
flowchart TB
  subgraph presentation [Presentation Layer]
    ReactVite["React + TypeScript + Vite"]
  end

  subgraph apiLayer [API Layer]
    REST["REST + OpenAPI /api/v1"]
  end

  subgraph serverLayer [Server Layer]
    Fastify["Fastify + TypeScript"]
    AppLayer["Application Layer — use cases, orchestration"]
  end

  subgraph domainLayer [Domain Layer]
    DomainMod["Bounded Contexts — learner, goals, skills, path, assessment, evidence, mastery…"]
  end

  subgraph infraLayer [Infrastructure Layer]
    RepoIfaces["Repository Interfaces"]
    DrizzleORM["Drizzle ORM"]
    PostgreSQL[("PostgreSQL")]
  end

  ReactVite --> REST
  REST --> Fastify
  Fastify --> AppLayer
  AppLayer --> DomainMod
  DomainMod --> RepoIfaces
  RepoIfaces --> DrizzleORM
  DrizzleORM --> PostgreSQL
```

### Responsabilités par couche

| Couche | Responsabilité | Ne fait PAS |
|--------|----------------|-------------|
| **Presentation** (React + Vite) | UI, routing client, formulaires, dashboards, visualisation mastery | Règles métier, persistance directe |
| **API** (REST + OpenAPI) | Contrats HTTP, validation entrées, auth middleware, sérialisation | Logique domaine, accès DB direct |
| **Server** (Fastify) | Routing HTTP, middleware, injection dépendances, orchestration requêtes | Règles métier pures |
| **Application** | Use cases, coordination domaine + infra, transactions | Rendering UI, SQL direct |
| **Domain** | Entités, invariants, services métier, policies | Dépendance framework/ORM |
| **Repository Interfaces** | Ports de persistance (contrats) | Implémentation SQL |
| **Infrastructure** (Drizzle + PostgreSQL) | Implémentation repositories, migrations, requêtes | Règles métier |

### Modular Monolith

Un **seul déploiement**, organisé en **bounded contexts** (DDD) avec dépendances unidirectionnelles. Pas de microservices au MVP.

Modules domaine cibles :

```
organization │ program │ cohort │ learner │ goals │ diagnostic
skills │ learning-path │ content │ assessment │ evidence │ mastery │ analytics
```

---

## 5. Architectural Principles

| Principe | Description |
|----------|-------------|
| **Domain first** | Le domaine est extrait et testé avant toute migration UI ou infra |
| **Séparation des couches** | Presentation / Application / Domain / Infrastructure — dépendances unidirectionnelles vers le domaine |
| **Dependency inversion** | Le domaine dépend d’interfaces (ports), pas d’implémentations concrètes |
| **Provider agnostic** | IA, persistance, auth interchangeables via adapters |
| **Business rules in domain** | Seuils, validation, progression, mastery — règles explicites et testables |
| **Explainability** | Décisions significatives (parcours, adaptation) portent une `rationale` |
| **Security by design** | Tenant isolation, RBAC, contrôles côté serveur dès le MVP |
| **Testability** | Logique pure testable sans DOM, sans DB, sans LLM |
| **Modularity** | Bounded contexts avec interfaces explicites |
| **Progressive migration** | Strangler fig — pas de big-bang rewrite |

### Règle centrale

```
RULES + DATA + MODELS + AI
```

L’IA **assiste** ; les **règles du domaine** **décident**. L’architecture n’est pas « AI everywhere ».

Source : [`docs/product-principles.md`](product-principles.md) — principes 5 et 6.

---

## 6. Domain Architecture

> Source principale : [`docs/domain-model.md`](domain-model.md), contrats [`src/shared/types/`](../src/shared/types/)

### Concepts métier

| Concept | Responsabilité |
|---------|----------------|
| **Organization** | Tenant B2B — frontière de sécurité et de données |
| **Program** | Offre pédagogique empaquetée (modules, skills cibles) |
| **Cohort** | Groupe d’apprenants dans un programme, borné dans le temps |
| **Learner** | Personne qui apprend — identité, profil, préférences |
| **Goal** | Destination d’apprentissage exprimée par l’apprenant |
| **Diagnostic** | Intake structuré produisant un profil baseline et des lacunes |
| **Skill** | Compétence référentielle réutilisable (Skill Graph) |
| **LearnerSkill** | État d’un apprenant vis-à-vis d’une Skill (niveau, preuves) |
| **Skill Gap** | Écart entre niveau cible et niveau actuel sur une Skill |
| **Learner State** | État de session / parcours actif de l’apprenant |
| **Learning Path** | Itinéraire ordonné d’étapes menant à l’objectif |
| **Activity** | Unité pédagogique consommable (micro-learning, exercice…) |
| **Assessment** | Mécanisme d’évaluation lié à une activité |
| **Evidence** | Preuve tangible produite par un assessment |
| **Mastery** | Niveau de maîtrise **évalué** d’une compétence |

### Noyau Learning Intelligence

```mermaid
flowchart LR
  Goal --> Skills
  Skills --> LearnerState[Learner State]
  LearnerState --> AdaptivePath[Adaptive Path]
  AdaptivePath --> Activity
  Activity --> Assessment
  Assessment --> Evidence
  Evidence --> Mastery
```

### Distinctions fondamentales

| Distinction | Signification |
|-------------|---------------|
| **Learner ≠ Learner State** | Learner = identité stable ; Learner State = snapshot session/parcours courant |
| **Skill ≠ LearnerSkill** | Skill = référentiel générique ; LearnerSkill = état individuel + preuves |
| **Goal ≠ Skill** | Goal = destination ; Skills = décomposition en capacités observables |
| **Progress ≠ Mastery** | Progress = avancement sur l’itinéraire (% étapes) ; Mastery = niveau évalué fondé sur Evidence |
| **Assessment ≠ Evidence** | Assessment = mécanisme ; Evidence = artefact produit par une tentative |

### Relations organisationnelles (cible)

```
Organization → Programs → Modules → Activities → Assessments
Organization → Cohorts → Learners
Learner → Goals → Diagnostic → Skill Profile → Skill Gaps
Learner → Learner State → Learning Path → Evidence → Mastery
```

---

## 7. MVP Domain Boundaries

> Sources : Phase 1.5 (référentiel produit), [`docs/product-principles.md`](product-principles.md)

### MVP (Must Have)

| Domaine | Périmètre MVP |
|---------|---------------|
| Auth + tenant | Organisation, session, rôles minimaux |
| Goal | Capture, analyse, confirmation |
| Diagnostic | Intake profil → baseline skills |
| Skills | Registre minimal + LearnerSkill + SkillGap |
| Learning Path | Génération rules + mock/AI assist |
| Activity + Assessment | Livraison contenu + quiz |
| Evidence | Persistance + gate de complétion |
| Mastery | Niveaux basiques dérivés des Evidence |
| Learner Dashboard | Console apprenant |
| Organization Management | Settings org, programmes, membres (program builder lite) |
| Simplified Trainer Dashboard | Progression cohorte, visibilité apprenants assignés (vue basique) |
| Tests | Golden Path E2E + domain unit tests |

### V1.1 (Should Come After Core Loop)

- Advanced Trainer Dashboard (capabilities formateur avancées, détection apprenants à risque avancée)
- Advanced Organization Analytics
- LearningEvent stream
- Content authoring UI
- Real LLM provider (assist optionnel)

### V2 (Deferred)

- AI Mentor UI
- Notifications
- Advanced analytics / predictive intelligence
- Marketplace
- Mobile apps
- Public API
- SSO / enterprise IdP
- Advanced skill graph visualization
- Remediation engine / Next Best Action

### Hors périmètre (Do Not Build)

- Microservices split
- Full CMS
- Custom ML training pipeline
- Big-bang rewrite du prototype
- Event sourcing complet

---

## 8. Domain Invariants

Les **11 invariants** suivants (I-01 à I-11) sont **non négociables**. Toute implémentation doit les respecter.

| # | Invariant | Description |
|---|-----------|-------------|
| I-01 | **Goal before Content** | Aucune activité sans objectif confirmé et compétence cible |
| I-02 | **Goal ≠ Skill** | Un objectif est une destination ; les skills en sont la décomposition |
| I-03 | **Progress ≠ Mastery** | La progression sur le path ne détermine pas le niveau de maîtrise |
| I-04 | **Evidence before Mastery** | Pas de mastery sans evidence validée |
| I-05 | **Evidence before Completion** | Pas de `step.status = done` sans evidence `passed = true` |
| I-06 | **Learner State evolves** | L’état apprenant mute via events domaine, pas par mutation UI directe |
| I-07 | **Adaptive Path** | Le parcours s’adapte aux gaps et preuves — pas figé arbitrairement |
| I-08 | **AI is not authority** | L’IA propose ; les règles métier décident |
| I-09 | **Explainability** | Décisions significatives portent une justification (`rationale`) |
| I-10 | **Tenant Isolation** | Toute donnée est scopée par `organizationId` ; accès vérifié côté serveur |
| I-11 | **Domain independence** | Le domaine ne dépend ni de React, ni de Fastify, ni de Drizzle |

---

## 9. AI Architecture & Governance

### Modèle : AI-assisted / rule-governed

```
"AI proposes; business rules decide."
```

**LLM output ≠ Business truth.**

### Où l’IA intervient (assist)

| Capacité | Rôle IA | Décideur final |
|----------|---------|----------------|
| Goal Intelligence | Clarifier / structurer un objectif textuel | Règles domaine + confirmation apprenant |
| Skill Intelligence | Suggérer décomposition en skills | Registre skills + validateurs |
| Adaptive Path assistance | Proposer ordre / contenu d’étapes | Path engine + prérequis |
| Evidence interpretation | Résumer réponses ouvertes (futur) | Rubriques de scoring |
| Mastery assistance | Suggérer niveau de confiance | Mastery rules (Evidence-based) |

### Où l’IA ne intervient PAS

- Validation de quiz (seuils déterministes)
- Mutation directe de `LearnerState`, `Mastery`, ou progression
- Décisions de tenant isolation ou RBAC
- Persistance sans validation schema

### Architecture AI cible

```
ai/
  ports/           Interfaces (GoalAnalyzer, PathGenerator, MentorAssistant…)
  providers/
    mock/          MockAIService — dev, tests, démo
    llm/           Fournisseur réel (Décision différée)
  tasks/           Use cases IA (generatePath, analyzeGoal…)
  validators/      Validation post-IA (schema + invariants métier)
  prompts/         Templates versionnés
```

### Gouvernance

| Exigence | Implémentation |
|----------|----------------|
| Structured output | Réponses JSON validées par schema (Zod ou équivalent) |
| Validation | Validators domaine avant toute mutation d’état |
| Audit | Log prompts/inputs/outputs côté serveur |
| Non-determinisme | Golden tests utilisent Mock ; AI eval tests avec fixtures et bandes de tolérance |
| Interdiction | L’IA ne appelle jamais `completeStep()` ni ne modifie Mastery directement |

### État actuel

Prototype 0 : `MockAIService` via factory `getAIService()` — keyword template matching, déterministe, client-side. Contrat `AIService.js` avec `generatePath()` et `askMentor()` (non câblé en UI).

---

## 10. Security & Multi-tenancy

### Modèle B2B SaaS

```
Organization
  → Users (memberships)
  → Programs
  → Cohorts
  → Learners
```

### Principes

| Principe | Description |
|----------|-------------|
| **Authentication** | Sessions serveur — identité vérifiée avant tout accès |
| **Authorization** | RBAC côté **serveur** — jamais confiance au client seul |
| **Tenant isolation** | `organizationId` est la frontière de sécurité sur toutes les entités |
| **Auditabilité** | Mutations sensibles tracées (voir section 14) |
| **Confidentialité** | Données scopées par organisation ; pas de fuite cross-tenant |

### Rôles MVP

| Rôle | Périmètre |
|------|-----------|
| **Learnova Admin** | Administration plateforme (multi-org) |
| **Organization Admin** | Settings org, programmes, membres |
| **Trainer** | Cohortes assignées, visibilité apprenants |
| **Learner** | Propres goals, path, evidence, mastery |

> **Note :** La matrice RBAC détaillée (permissions par ressource) est une **Décision différée** — à définir avec le packaging commercial Phase 1.5.

### État actuel

M5.1 identity island, M5.2 sessions HTTP et M5.3 preuve d’isolation tenant sont **Done**. Confirm/generate restent publics. OrganizationContext est request-scoped ([ADR-015](#adr-015--m53-request-scoped-organization-context)).

---

## 11. Data Architecture

### Source de vérité

| Phase | Persistance | Rôle |
|-------|-------------|------|
| Prototype 0 (actuel) | `localStorage` | Demo single-user |
| Migration | Coexistence localStorage + API | Strangler |
| Cible | **PostgreSQL** | Source de vérité unique |

### Accès aux données

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Domain | Repository interfaces (ports) | Contrats de persistance |
| Infrastructure | **Drizzle ORM** | Implémentation repositories, migrations |
| Base | **PostgreSQL** | Stockage relationnel multi-tenant |

### Indépendance du domaine

Le domain layer **ne dépend pas** de Drizzle ni de PostgreSQL. Les repositories implémentent des interfaces définies par le domaine. Drizzle est un détail d’infrastructure interchangeable.

### Données persistantes (cible MVP)

Organization, Program, Cohort, Learner, Goal, Diagnostic, Skill, LearnerSkill, SkillGap, LearnerState, LearningPath, PathStep, Activity, Assessment, Evidence, Mastery, User, OrganizationMembership.

### Rôle résiduel de localStorage

Pendant la migration (stages M1–M6), `localStorage` peut subsister pour :

- Mode demo offline du prototype Vite
- Cache client non autoritaire
- Tests E2E du golden path legacy

`localStorage` n’est **jamais** source de vérité en production multi-tenant.

### Schéma SQL (M4 clos)

Spine durable dans [`src/infra/db/schema.ts`](../src/infra/db/schema.ts) (`SCHEMA_SLICE = m4.4-evidence`) :

| Table | Rôle |
|-------|------|
| `goals` | Goal confirmable (UUID PK, CHECKs level/intent/status) |
| `learning_paths` | Path accepté ; FK `goal_id` ON DELETE RESTRICT |
| `learning_path_steps` | Étapes relationnelles UUID ; unique `(path_id, position)` |
| `evidence` | Tentatives quiz append-only ; FK `step_id` ON DELETE RESTRICT ; `answers` JSONB |

Pas de colonnes `user_id` / `learner_id` / `organization_id` / statut de progression aujourd’hui. La stratégie d’attache d’identité (colonnes, tables de jointure, backfill, ou conservation de lignes anonymes) reste une **question d’audit M5** — non décidée ici.

Le catalogue MVP complet (Organization, Mastery, …) reste **hors M4**. Seed data produit : différé (M6).

---

## 12. API Architecture

### Style

| Décision | Valeur |
|----------|--------|
| Protocole | **REST** |
| Spécification | **OpenAPI 3.x** |
| Préfixe | `/api/v1/` |
| Versionnement | URL prefix (`/v1/`) ; breaking changes = `/v2/` |

### Principes

| Principe | Description |
|----------|-------------|
| Thin controllers | Routes HTTP délèguent aux application services |
| Validation entrées | Schema validation (Zod) à la frontière API |
| Pas de logique domaine | L’API orchestre, le domaine décide |
| Tenant scoping | `organizationId` vient des **memberships** après résolution de l’utilisateur de session, jamais depuis le body seul. La session n’a pas d’`organization_id`. |
| Sérialisation | DTOs API ≠ entités domaine |

### Organisation logique (aperçu, non exhaustif)

```
/api/v1/
  auth/              login, logout, session
  organizations/     tenant management
  programs/          catalog
  cohorts/           enrollment
  learners/          profile, state
  goals/             CRUD + analyze
  diagnostics/       run, results
  skills/            registry, learner-skills, gaps
  paths/             generate, retrieve, advance
  activities/        content delivery
  assessments/       definitions
  evidence/          record attempts
  mastery/           query, compute
```

### Alternatives rejetées

- **GraphQL** — complexité excessive pour le MVP CRUD (ADR-006)

---

## 13. Authentication & Session Architecture

### Modèle validé

| Aspect | Décision |
|--------|----------|
| Mécanisme | **Sessions serveur** |
| Transport | **Cookies HTTP-only** |
| Production | Flag `Secure`, `SameSite` approprié |
| Alternative rejetée | JWT stateless comme mécanisme principal |

### Modèle d’identité

```
User
  → OrganizationMembership (organizationId + role)
  → Session (server-side, révocable)
```

### Flux

1. `POST /api/v1/auth/login` — vérifie credentials, crée session serveur
2. Cookie `HttpOnly` retourné au client
3. Requêtes suivantes : middleware extrait session → injecte `userId`, `organizationId`, `role`
4. `POST /api/v1/auth/logout` — invalide session

### Détails d’implémentation différés

| Élément | Statut |
|---------|--------|
| Librairie session (Lucia, custom, etc.) | À définir ultérieurement |
| Durée de session / refresh | À définir ultérieurement |
| Rate limiting login | **M5.2** — `@fastify/rate-limit` sur `POST /api/v1/auth/login` (mémoire ; Redis différé). Pas M5.3. |
| Password hashing | **Argon2id** via **`@node-rs/argon2`** (M5.2). |

---

## 14. Observability, Domain Events & Audit

### Trois niveaux

| Niveau | Contenu | Exemples |
|--------|---------|----------|
| **1. Technical logs** | Infra, HTTP, erreurs, latence | Request ID, status codes, stack traces |
| **2. Domain events** | Faits métier significatifs | GoalCreated, PathGenerated, EvidenceCreated |
| **3. Audit records** | Mutations sensibles, conformité | Changement de rôle, accès cross-tenant bloqué |

### Exemples de domain events

| Event | Déclencheur |
|-------|-------------|
| `GoalCreated` | Apprenant soumet un objectif |
| `DiagnosticCompleted` | Intake diagnostic terminé |
| `PathGenerated` | Parcours généré depuis goal + gaps |
| `AssessmentSubmitted` | Tentative de quiz soumise |
| `EvidenceCreated` | Preuve enregistrée |
| `MasteryChanged` | Niveau de maîtrise recalculé |
| `PathAdapted` | Parcours modifié suite à evidence/gap |

### Principes

- **PostgreSQL reste la source de vérité** — les events alimentent analytics et audit, pas un second store autoritaire
- **Event sourcing complet** — **Décision différée** (hors périmètre MVP)
- Les domain events MVP peuvent être persistés dans une table `domain_events` append-only

### État actuel

Prototype 0 : **aucun event log, aucun audit trail**.

---

## 15. Testing Strategy

### Pyramide de tests (cible)

```
        E2E (Playwright)           ← Golden Path, parcours complets
       /              \
  API / Integration tests         ← Auth, tenant, endpoints
     /                  \
Domain unit tests                  ← Règles métier pures, sans DOM/DB
```

### Types de tests

| Type | Outil | Cible |
|------|-------|-------|
| Domain unit tests | Vitest | Progression, evidence, mastery, goals, skills |
| Integration tests | Vitest + Fastify inject | Auth, tenant isolation, repositories |
| API tests | Vitest / supertest | Contrats REST |
| E2E tests | Playwright | Golden Path browser |
| AI evaluation tests | Vitest + fixtures | Mock determinism, tolerance bands pour LLM futur |
| Typecheck | TypeScript | Contrats stricts |

### Golden Path (spécification comportementale)

```
Goal → Diagnosis → Skills → Path → Activity → Assessment → Evidence → Mastery
```

Les tests E2E existants (TEST-E2E-001→008) couvrent la tranche prototype :

```
Goal → Roadmap → Dashboard → Lesson → Quiz → Validation → Progression
```

Ils restent des **golden tests** pendant toute la migration. Aucun test existant ne doit être affaibli.

### Mock AI determinism

`MockAIService` est le provider par défaut en dev et CI. Les tests de génération de parcours sont déterministes (keyword matching). Les tests AI evaluation futurs utiliseront des fixtures, pas des appels LLM live en CI.

### État actuel

| Suite | Volume | Statut |
|-------|--------|--------|
| Unit (Vitest) | 25 tests | Protégé |
| E2E (Playwright) | 10 tests | Protégé |
| Integration API | 0 | Cible M3 |
| Domain module unit | 0 | Cible M1 |

---

## 16. Migration Baseline

### Stratégie validée : Strangler Fig Pattern

```mermaid
flowchart LR
  subgraph legacy [Legacy - Prototype Vite]
    ViteApp[Vite + Vanilla JS]
  end

  subgraph newArch [New Architecture]
    DomainTS[Domain TS Modules]
    FastifyAPI[Fastify API]
    ReactUI[React + Vite]
  end

  ViteApp -->|"extract logic"| DomainTS
  DomainTS -->|"expose via"| FastifyAPI
  FastifyAPI -->|"consume via"| ReactUI
  ViteApp -->|"retire route by route"| ReactUI
```

### Principes de migration

| Principe | Description |
|----------|-------------|
| **Progressive extraction** | Extraire logique domaine en TS pur avant de migrer UI |
| **Vertical slices** | Livrer une tranche complète (domaine → API → UI) à la fois |
| **Golden Reference** | Le prototype Vite reste runnable jusqu’à parity prouvée |
| **Coexistence temporaire** | Legacy et new architecture coexistent — pas de big-bang |
| **Retrait legacy** | Une route/composant legacy n’est retiré qu’après E2E vert sur la replacement |
| **Tests d’abord** | Golden tests protègent le comportement à chaque étape |

### Anti-patterns interdits

- Big-bang rewrite (Prototype → React + API en une seule PR)
- Migration UI avant extraction domaine
- Affaiblir les tests golden pour faire passer la migration
- Supprimer le prototype avant parity E2E

Source : [`docs/migration-map.md`](migration-map.md), [`docs/architecture.md`](architecture.md)

---

## 17. Migration Stages

> Trajectoire validée. Chaque stage est indépendant — pas d’obligation de tout implémenter en une seule phase.

| Stage | Nom | Objectif | État |
|-------|-----|----------|------|
| **M0** | Baseline protégée | Tests E2E + unit + CI verts ; docs Phase 0–1.5 ; legacy nettoyé | **Done** |
| **M1** | Domain extraction | Modules TS purs (`src/modules/`) ; store.js → adapters ; domain unit tests | **Done** |
| **M2** | Application Services | Use cases orchestrant domaine + ports ; application tests | **Done** |
| **M3** | Fastify API | REST `/api/v1/` ; OpenAPI ; API integration tests (auth production = M5) | **Done** |
| **M4** | PostgreSQL + Drizzle | Infra + repos Goal/Path/Evidence ; migrations versionnées. Seed produit différé. | **Done** |
| **M5** | Authentication + Multi-tenancy | Sessions, RBAC, tenant isolation en production | **In progress** (M5.1–M5.3 Done) |
| **M6** | First complete Vertical Slice | Organization → Mastery end-to-end via API | Planned |
| **M7** | React | UI React + TypeScript + Vite consommant l’API ; retrait progressif views legacy | Planned |

### Dépendances entre stages

```
M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7
         ↑                    ↑
    Domain first          Vertical slice
                          before full React
```

### Slice M5.1 Identity island — Done

M4 est **clos**. Pas de M4.5. M5.1–M5.3 sont **exécutés** : identity island, sessions hachées, cookie `learnova.sid`, preuve `GET /api/v1/organizations/:organizationId/context`. Spine M4 toujours non possédé. Confirm/generate publics.

Décisions : [`docs/m5-decisions.md`](m5-decisions.md), [`docs/m5.2-decisions.md`](m5.2-decisions.md), [`docs/m5.3-decisions.md`](m5.3-decisions.md), [`docs/m6.1-decisions.md`](m6.1-decisions.md), [`docs/m6.2-decisions.md`](m6.2-decisions.md), [`docs/m6.3-decisions.md`](m6.3-decisions.md). ADR-013, ADR-014, ADR-015, ADR-016, ADR-017, **ADR-018 Accepted**. **M6.1 is COMPLETE AND VALIDATED**. **M6.2 is COMPLETE AND VALIDATED** (C1–C3; FINAL VALIDATION PASS). **M6.3 is COMPLETE AND VALIDATED** (C1 owned Evidence application/port; C2 tenant-safe Drizzle Evidence persistence; C3 owned Evidence POST; FINAL VALIDATION PASS; 228 executable tests). Tenant-safe accepted Path + nested Steps persist under an already-owned Goal: LearnerContext is server-resolved; owned Goal authorization precedes Path persist; DB re-proves `goalId` + `organizationId` + `learnerId`; Path + Steps are transactional; HTTP `POST /api/v1/organizations/:organizationId/goals/:goalId/path`; unknown/inaccessible/legacy fail closed without leaking. Learner is organization-scoped; Goal is the ownership root; Path/Step/Evidence ownership is derived through Goal (Evidence → Step → Path → Goal); sessions remain User-only; public confirm/generate remain public; Golden Reference unchanged; no Path/Step/Evidence tenant FKs; no UNIQUE(`goal_id`); no 0008. M6.3 persists tenant-safe Evidence **write** through the same derived chain: `POST /api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId/evidence`; `Evidence.stepId` comes from the authorized Step; `type` is server-controlled `quiz_attempt`; `id` and `recordedAt` are server-generated; C2 proves `stepId` + `goalId` + `organizationId` + `learnerId` before INSERT.

**Prochain :** next milestone **NOT STARTED** — separate architecture/readiness review required. Ne pas figer un tenant actif sur la session.

---

## 18. First Vertical Slice

### Chaîne cible

```
Organization
  → Program
  → Learner
  → Goal
  → Diagnostic
  → Skills
  → Skill Gaps
  → Learner State
  → Adaptive Path
  → Activity
  → Assessment
  → Evidence
  → Mastery
```

### Objectif

Prouver le **cœur Learning Intelligence** de Learnova de bout en bout : un apprenant authentifié dans une organisation parcourt la chaîne complète, avec evidence persistée et mastery calculée par règles métier — pas par l’IA.

### Definition of Done

| Critère | Validation |
|---------|------------|
| Apprenant authentifié dans une org | Session + tenant scoping |
| Goal capturé et confirmé | API + domaine |
| Diagnostic produit skill gaps | API + domaine |
| Path généré (rules + mock AI assist) | API + domaine |
| Activity livrée + quiz soumis | API + UI ou API directe |
| Evidence persistée en PostgreSQL | Repository + Drizzle |
| Mastery calculée depuis Evidence | Domain service, pas LLM |
| Golden Path E2E vert | Playwright |
| Domain unit tests verts | Vitest |
| API integration tests verts | Vitest + Fastify inject |
| Prototype Vite legacy intact ou route retirée avec parity prouvée | E2E |

### Ordre de construction (justification)

1. **Organization/Program** — frontière tenant (tout dépend de là)
2. **Learner + Auth** — identité requise pour état persisté
3. **Goal** — point d’entrée (Goal before Content)
4. **Diagnostic** — différenciation intelligence vs LMS
5. **Skills + Gaps** — adaptive path vs template matching
6. **Path** — réutilise MockAI/rules, scopé au programme
7. **Activity + Assessment** — schéma contenu existant (`lessons.js`)
8. **Evidence + Mastery** — boucle intelligence auditable

---

## 19. Engineering Constitution

Règles opérationnelles pour toute contribution future :

| # | Règle |
|---|-------|
| C-01 | **Domain independence** — le domaine ne importe ni React, ni Fastify, ni Drizzle |
| C-02 | **Dependency direction** — toujours vers le domaine (Presentation → Application → Domain ← Infrastructure) |
| C-03 | **AI governance** — l’IA ne mute jamais directement les états critiques |
| C-04 | **Tenant isolation** — `organizationId` sur toute requête et toute entité |
| C-05 | **Repository usage** — pas d’accès DB direct depuis Application ou Domain |
| C-06 | **Tests** — pas de merge si Golden Path E2E rouge |
| C-07 | **Golden Path** — les tests existants sont des spécifications, pas des obstacles |
| C-08 | **Migration** — strangler fig, vertical slices, pas de big-bang |
| C-09 | **Scope strict** — une PR = un slice ; pas de refactoring opportuniste |
| C-10 | **Plan before significant changes** — todo plan pour toute modification multi-fichiers |
| C-11 | **No implicit architectural decisions** — toute décision significative → ADR |
| C-12 | **New dependencies require justification** — pas de lib sans raison documentée |
| C-13 | **MVP boundaries** — respecter section 7 ; pas de feature V2 dans le MVP |
| C-14 | **Architecture evolves through explicit decisions** — pas de dérive silencieuse |
| C-15 | **Cursor/Codex may propose; they may not silently change an architectural decision** | |

---

## 20. Architecture Decision Records

### ADR-001 — Backend

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Node.js + Fastify + TypeScript** |
| **Context** | MVP B2B nécessite un serveur API multi-tenant, testable, performant |
| **Alternatives considered** | Express (plus de boilerplate), NestJS (sur-engineering MVP), serverless (complexité cold start + sessions) |
| **Consequences** | Fastify `.inject()` pour tests API ; écosystème plugins ; équipe doit maîtriser TS côté serveur |

### ADR-002 — Persistence

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **PostgreSQL** comme source de vérité unique |
| **Context** | Modèle relationnel multi-tenant (org → cohort → learner → evidence) ; intégrité référentielle |
| **Alternatives considered** | MongoDB (relations complexes), SQLite (pas multi-tenant prod), Firebase (vendor lock-in) |
| **Consequences** | Nécessite hébergement PostgreSQL (Décision différée) ; migrations versionnées |

### ADR-003 — Monorepo

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Monorepo unique** — prototype Vite + domain modules + server API |
| **Context** | Types partagés, CI unifiée, strangler migration |
| **Alternatives considered** | Polyrepo (frontend + backend séparés) — rejeté pour MVP (coordination) |
| **Consequences** | Structure claire requise ; `package.json` unique ; attention aux dépendances |

### ADR-004 — Frontend

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **React + TypeScript + Vite** — pas Next.js |
| **Context** | Composants réutilisables pour 3 expériences (learner, trainer, org) ; Vite déjà en place |
| **Alternatives considered** | Next.js (SSR non requis MVP, complexité migration), Vue (écosystème), rester vanilla JS (non scalable) |
| **Consequences** | Migration UI en M7, après domaine stable ; prototype vanilla reste golden reference jusqu’à parity |

### ADR-005 — Authentication

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Sessions serveur** + cookies **HTTP-only** |
| **Context** | Apps web B2B ; révocation simple ; pas de JWT stateless comme mécanisme principal |
| **Alternatives considered** | JWT (révocation complexe), OAuth-only (pas de credentials MVP), localStorage tokens (insecure) |
| **Consequences** | Sticky sessions ou store session partagé si multi-instance (Décision différée) |

### ADR-006 — API

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **REST** + **OpenAPI 3.x** sous `/api/v1/` |
| **Context** | Clarté contrats, tooling, testabilité, équipe |
| **Alternatives considered** | GraphQL (overhead MVP), tRPC (couplage TS client/server), gRPC (pas browser-native) |
| **Consequences** | Spec OpenAPI maintenue ; versioning par URL prefix |

### ADR-007 — Data Access

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Drizzle ORM** + **Repository interfaces** |
| **Context** | Type-safety, migrations, domaine indépendant de l’ORM |
| **Alternatives considered** | Prisma (génération client, couplage), raw SQL (maintenance), TypeORM (complexité) |
| **Consequences** | Drizzle reste en infrastructure layer ; repositories testables avec in-memory adapters |

### ADR-008 — Domain Architecture

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Modular monolith** avec **DDD bounded contexts** |
| **Context** | MVP solo deploy ; complexité domaine élevée ; équipe petite |
| **Alternatives considered** | Microservices (prématuré), flat MVC (couplage), clean architecture sans bounded contexts (ambiguïté) |
| **Consequences** | Modules domaine sous `src/modules/` ; interfaces explicites entre contexts |

### ADR-009 — AI Architecture

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **AI-assisted, rule-governed** — ports + providers + validators |
| **Context** | Principes produit : AI assists, Rules decide ; explainability requise |
| **Alternatives considered** | AI-first (rejeté — non explainable), no AI (rejeté — valeur produit), RAG-only (insuffisant seul) |
| **Consequences** | Mock provider par défaut ; LLM réel opt-in ; validators obligatoires |

### ADR-010 — Observability & Audit

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | Trois niveaux : technical logs + domain events + audit records |
| **Context** | B2B SaaS exige traçabilité ; analytics future |
| **Alternatives considered** | Event sourcing complet (prématuré), logs only (insuffisant audit), APM seul (pas domaine) |
| **Consequences** | Table `domain_events` append-only MVP ; event sourcing complet différé |

### ADR-011 — Testing

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | Domain unit tests first + Golden Path E2E + API integration tests |
| **Context** | Baseline protégée Phase 1A/1B ; migration sans régression |
| **Alternatives considered** | E2E only (lent, fragile), TDD UI-first (couplage), no tests (rejeté) |
| **Consequences** | CI exige vert sur toutes les suites ; Mock AI determinism en CI |

### ADR-012 — Migration

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Strangler fig** + **vertical slices** + **golden reference** |
| **Context** | Prototype fonctionnel existant ; pas de big-bang ; équipe réduite |
| **Alternatives considered** | Big-bang rewrite (risque régression), parallel run infini (dette), freeze prototype (bloque dev) |
| **Consequences** | Prototype Vite maintenu jusqu’à M7 ; extraction progressive M1→M6 |

### ADR-013 — M5 identity island

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **User ≠ Learner.** Organization membership is a separate aggregate from User. M5.1 persists an **identity island** only (`organizations`, `users`, `user_credentials`, `organization_memberships`). Existing M4 `goals` / `learning_paths` / `learning_path_steps` / `evidence` rows remain **structurally unowned** during M5.1. Learner and learning-resource ownership are **deferred to M6**. |
| **Context** | M5 must introduce verified identity and multi-org membership without collapsing User into Learner, without owning the anonymous learning spine, and without implementing sessions (ADR-005 remains the session *style*; session **tables/HTTP** are M5.2). |
| **Alternatives considered** | User = Learner (rejeté — formateurs/admins) ; `organization_id` on `users` (rejeté — multi-org) ; nullable FKs on M4 tables now (rejeté — pas de backfill) |
| **Consequences** | ADR-002 (PostgreSQL) et ADR-005 (sessions + cookies HTTP-only) **inchangés**. Pas de table `learners` ni `sessions` en M5.1. Rôles membership `org_admin` \| `member` uniquement (pas `learner`). |

### ADR-014 — M5.2 sessions (hashed cookie token)

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | Authentication uses **revocable server-side sessions**. The browser cookie **`learnova.sid`** contains a **random high-entropy opaque token**. PostgreSQL stores **only SHA-256(token)** as `token_hash`. A **raw reusable session secret is never stored** in PostgreSQL. Table `sessions` has **no `organization_id`**. A session authenticates **User only**; organization context must later be **validated through memberships**. Cookie: **HttpOnly**, **SameSite=Lax**, **Path=/**, **host-only**, **Secure in production only**. Absolute expiry **24h**; **no sliding/idle** expiry in M5.2. Revocation uses **`revoked_at`**; logout revokes the **current** session. **Argon2id** is approved; the **exact npm library is not frozen**. M5.2 **includes login rate limiting** on `POST /api/v1/auth/login`. **JWT is not** the primary auth mechanism. **No public registration** in M5.2. **M5.3** owns full tenant-isolation proof. M4 Goal/Path/Step/Evidence **ownership remains unchanged**. Golden Reference **remains unchanged**. |
| **Context** | ADR-005 already decided server sessions + HTTP-only cookies. This ADR records M5.2 token storage, cookie attributes, TTL, hasher, and login rate-limit **without changing ADR-002 or ADR-005 Decision rows**. |
| **Alternatives considered** | Raw session secret in PostgreSQL ; `organization_id` on `sessions` as active tenant ; JWT as primary auth ; encrypted cookie-only (no server revoke) ; sliding/idle expiry in M5.2 |
| **Consequences** | Schema `sessions` and auth HTTP follow this ADR (C-11). Confirm/generate stay public. Identity island (ADR-013) unchanged. Argon2 npm package chosen at implementation after Windows/CI check. |

### ADR-015 — M5.3 request-scoped organization context

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | M5.3 introduces a **request-scoped OrganizationContext**. Authentication remains **User-only** through ADR-014 server sessions. OrganizationContext is derived from **AuthContext + requested `organizationId`** only after validating that requested id against **AuthContext.memberships**. A client `organizationId` is a **request**, never authorization authority. For the M5.3 proof resource, organization selection uses the path parameter **`GET /api/v1/organizations/:organizationId/context`**. Successful context contains only **`userId`**, **`organizationId`**, **`role`**. Missing or invalid authentication → **`AUTH_UNAUTHENTICATED`** → HTTP **401**. Authenticated user without membership in the requested organization → **`ORG_FORBIDDEN`** → HTTP **403**. **`ORG_FORBIDDEN` is generic** and must not reveal whether the organization exists (unknown org, other tenant, zero memberships, and missing membership share the same denial). Table `sessions` still has **no `organization_id`**. Do **not** introduce a session-owned or current organization. Do **not** introduce global tenant-selection middleware in M5.3. **Confirm/generate remain public.** M4 Goal/Path/Step/Evidence **ownership remains unchanged**. **No Learner.** **No full RBAC.** **No schema change or migration.** Golden Reference **remains unchanged**. |
| **Context** | ADR-014 establishes that sessions authenticate User only and that organization context must later be membership-validated. M5.3 records the smallest production-meaningful tenant-isolation proof without turning the session into tenant authority. |
| **Alternatives considered** | `X-Organization-Id` request header ; `organizationId` in body ; `organizationId` query parameter ; server-selected single organization ; switch-organization endpoint persisted on session ; `sessions.organization_id` ; tests-only proof without an HTTP resource |
| **Consequences** | M5.3 may implement one request-scoped OrganizationContext resolver and one proof route `GET /api/v1/organizations/:organizationId/context`. Existing AuthContext remains unchanged. Existing `organization_memberships` and `listByUserId` are sufficient. No DB repository or schema extension is required. M6 owns learning-object tenant ownership and later broader tenant-aware operations. A request header may be reconsidered later when multiple organization-scoped routes exist. |

### ADR-016 — Organization-scoped Learner and Goal ownership

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **Learner** is a first-class **organization-scoped learning identity** linked to a **User**, not the User, not OrganizationMembership, not LearnerState, and not a membership role `learner`. Conceptual row: `id`, `organization_id`, `user_id`, `created_at`, with **UNIQUE `(organization_id, user_id)`**. A User may have a distinct Learner in each Organization; **learning state is isolated** between those Learners. A User may exist **without** a Learner. Learner-before-User / invitations are **deferred**. **LearnerContext** `{ learnerId, userId, organizationId }` is resolved **server-side** from authenticated User → **OrganizationContext** (ADR-015) → Learner lookup. Client `learnerId`, `organizationId`, or `role` never establishes authority. **Goal** is the **ownership root** of the persisted learning journey. Future owned Goal rows carry **`organization_id` + `learner_id`** for the **same** tenant. LearningPath / Step / Evidence ownership is **derived** through `goal_id` (path → goal; step → path → goal) in the first M6 slice — **do not** duplicate org/learner FKs on those tables in that slice. Existing **M4 Goal rows must not receive fabricated owners**; initial Goal ownership FKs are **nullable**; tenant-aware APIs **fail closed** for unowned rows and must not expose a legacy object merely because its id is known. Authorization chain: `learnova.sid` → `resolveSession` → AuthContext → requested organizationId → `resolveOrganizationContext` → OrganizationContext → `resolveLearnerContext` → LearnerContext → owned use case → repository constrained by tenant/learner. OrganizationContext is **necessary but not sufficient** for learning-object access. **AuthSession remains User-only** (ADR-014): no `sessions.organization_id`, no `sessions.learner_id`, no global current organization or learner. Cross-tenant and cross-learner access denied; unknown and unauthorized object ids must not leak existence (generic authorization denial). **Confirm/generate remain public** in the first M6 slice. Golden Reference UI, `localStorage`, and E2E stay unchanged; no GR login requirement and **no dual-write** in M6.1. **M6 / M6.1 code is not started by this ADR.** |
| **Context** | User is the authentication identity and may belong to multiple Organizations. OrganizationMembership is affiliation/role only (ADR-013). ADR-013 established **User ≠ Learner** and deferred Learner plus learning-resource ownership to M6. M4 persisted Goal/Path/Step/Evidence **without** ownership. M5.3 established request-scoped OrganizationContext (ADR-015). M6 needs an explicit tenant-local learning identity and ownership boundary before any migration or persist HTTP. |
| **Alternatives considered** | User == Learner ; global 1:1 Learner→User ; OrganizationMembership == Learner ; LearnerState == Learner identity ; `user_id`-only Goal ownership ; `organization_id`-only Goal ownership ; `sessions.organization_id` ; `sessions.learner_id` ; client-selected Learner authority ; immediate org/learner columns on Path/Step/Evidence ; fake backfill of M4 rows. **Deferred:** Learner-before-User ; invitations ; Program ; Cohort ; Mastery persistence ; full RBAC ; Path/Evidence persist HTTP ; Golden Reference integration ; SSO/IdP ; membership management UI. |
| **Consequences** | A **future** M6.1 migration (not generated by this ADR) will add table `learners` (`organization_id` FK, `user_id` FK, UNIQUE `(organization_id, user_id)`), nullable `organization_id` and `learner_id` on `goals`, and integrity so Goal and Learner share the same Organization. Nullable Goal FKs are **transitional compatibility** for existing M4 data, **not** the desired model for newly tenant-owned Goals. Implementation follows [`docs/m6.1-implementation-plan.md`](m6.1-implementation-plan.md) only after this ADR. Confirm/generate stay public until a later ADR. ADR-002/005/013/014/015 Decision rows **unchanged**. |

### ADR-017 — Tenant-safe accepted Path persistence through owned Goal

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **M6.2** adds **tenant-safe persistence of an accepted LearningPath and its nested Steps** under an **already-owned Goal**. Goal remains the **ownership root**. Path and Step ownership remains **derived** through `goal_id` / `path_id`. Do **not** add `organization_id` or `learner_id` on Path or Step. Authorization: `learnova.sid` → `resolveSession` → requested `organizationId` → `resolveOrganizationContext` → `resolveLearnerContext` → **owned Goal lookup** scoped by Goal id + `organizationId` + `learnerId` → owned Path persistence → scoped repository. Do **not** authorize Path writes with global `GoalRepository.getById` plus in-memory comparison. Path-parameter `goalId` is a requested identifier, not proof of ownership. Persisted `Path.goalId` is stamped from the **server-resolved owned Goal**, never from body/query/header `goalId` as authority. Client `learnerId` and extra-path `organizationId` are never authority. **Sessions remain User-only.** **Learner creation remains explicit/in-process** (`persistLearner`); no Learner HTTP, no login/membership auto-provision. **`POST /api/v1/goals/confirm` and `POST /api/v1/paths/generate` remain public** (no login, no LearnerContext, no GR dual-write). Golden Reference remains **unchanged**. **Evidence persist HTTP is deferred.** Tenant APIs **fail closed** on legacy NULL/NULL Goals. Unknown and inaccessible resources stay **non-leaking**. Intended HTTP: `POST /api/v1/organizations/:organizationId/goals/:goalId/path`. No Path list/update/delete, no Goal list/update/delete, no Evidence POST in M6.2. **No migration 0008** for Path persist; existing `learning_paths.goal_id` is sufficient. **Do not** introduce UNIQUE(`goal_id`) without a separate cardinality decision. **M6.2 code is not started by this ADR.** |
| **Context** | M6.1 (ADR-016) established organization-scoped Learner, LearnerContext, owned Goal persist/read, and tenant-safe derived Path/Step/Evidence **reads**. The server-side learning chain still **stops at Goal for writes**. Legacy `acceptLearningPath` uses unscoped `GoalRepository.getById` and must not be reused as tenant authorization. M6.2 closes only this Path+Steps write gap. |
| **Alternatives considered** | Global `getById` then JS ownership compare ; client `learnerId` / body `goalId` as authority ; Path/Step `organization_id`/`learner_id` ; protecting public confirm/generate ; GR login / dual-write ; Learner auto-provision ; Path+Evidence in one slice ; UNIQUE(`goal_id`) without cardinality freeze ; fake legacy backfill ; `sessions.organization_id` / `learner_id` |
| **Consequences** | Implementation follows [`docs/m6.2-implementation-plan.md`](m6.2-implementation-plan.md) only after this ADR. Public and tenant-aware flows continue to coexist. Learner HTTP and Evidence persist remain deferred. ADR-013/014/015/016 Decision rows **unchanged**. |

### ADR-018 — Tenant-safe owned Evidence persistence through Goal-derived ownership

| | |
|---|---|
| **Status** | Accepted |
| **Decision** | **M6.3** adds **tenant-safe persistence of Evidence** under an **already-owned Goal**, through Step → Path → Goal. Goal remains the **ownership root**. Evidence ownership remains **derived**. Do **not** add `organization_id` or `learner_id` on Evidence, Step, or Path. Authorization: `learnova.sid` → `resolveSession` → requested `organizationId` → `resolveOrganizationContext` → `resolveLearnerContext` → prove the target **Step belongs to a Path whose Goal** matches Goal id + `organizationId` + `learnerId` → persist Evidence under that Step → scoped repository. Do **not** authorize Evidence writes with global `getById` of Evidence, Step, Path, or Goal plus in-memory tenant comparison. Path-parameter `goalId` and `stepId` are requested identifiers, not proof of ownership. Persisted `Evidence.stepId` is stamped from the **server-resolved authorized Step**, never from body/query/header `stepId` as authority. Client `learnerId` and extra-path `organizationId` are never authority. Body `goalId` cannot redirect ownership. **Sessions remain User-only.** **Learner creation remains explicit/in-process** (`persistLearner`); no Learner HTTP, no login/membership auto-provision. **`POST /api/v1/goals/confirm` and `POST /api/v1/paths/generate` remain public**. Golden Reference remains **unchanged**. Intended HTTP: `POST /api/v1/organizations/:organizationId/goals/:goalId/steps/:stepId/evidence`. Payload is already-scored Evidence (`score`, `maxScore`, `passed`, `answers`); `type` is server `quiz_attempt`; `id` is generated if absent; persist does not mutate progress (I-05 stays in domain). No Evidence list/update/delete in M6.3. Existing owned Evidence GET remains. Tenant APIs **fail closed** on legacy NULL/NULL Goals. Unknown and inaccessible descendant resources stay **non-leaking**. **No migration 0008**; existing `evidence.step_id` is sufficient. **Do not** introduce UNIQUE(`goal_id`). **M6.3 code is not started by this ADR.** |
| **Context** | M6.1 (ADR-016) established derived Evidence **reads** through Goal. M6.2 (ADR-017) closed tenant-safe Path+Steps **writes**. Unscoped `persistEvidence` / `EvidenceRepository.save` must not be reused as tenant authorization. M6.3 closes only this Evidence write gap. |
| **Alternatives considered** | Global `getById` then JS ownership compare ; client `learnerId` / body `goalId` / body `stepId` as authority ; Evidence/Path/Step `organization_id`/`learner_id` ; Path id as client authorization parameter ; `submitAndPersistEvidence` as owned HTTP ; Evidence list-by-step in the same slice ; protecting public confirm/generate ; GR login / dual-write ; Learner auto-provision ; UNIQUE(`goal_id`) ; fake legacy backfill ; `sessions.organization_id` / `learner_id` ; migration 0008 |
| **Consequences** | Implementation follows [`docs/m6.3-implementation-plan.md`](m6.3-implementation-plan.md) only after this ADR. Public and tenant-aware flows continue to coexist. Learner HTTP remains deferred. ADR-013/014/015/016/017 Decision rows **unchanged**. |

---

## 21. ADR Coherence Matrix

Matrice de compatibilité entre les 12 ADR validées :

|  | 001 Backend | 002 PG | 003 Mono | 004 React | 005 Session | 006 REST | 007 Drizzle | 008 DDD | 009 AI | 010 Obs | 011 Test | 012 Migr |
|--|:-----------:|:------:|:--------:|:---------:|:-----------:|:--------:|:-----------:|:-------:|:------:|:-------:|:--------:|:--------:|
| **001 Backend** | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **002 PG** | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **003 Mono** | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **004 React** | ✓ | ✓ | ✓ | — | ✓ | ✓ | ○ | ✓ | ✓ | ○ | ✓ | ⚠ |
| **005 Session** | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ |
| **006 REST** | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **007 Drizzle** | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | — | ⚠ | ○ | ✓ | ✓ | ✓ |
| **008 DDD** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ⚠ | — | ✓ | ✓ | ✓ | ✓ |
| **009 AI** | ✓ | ✓ | ✓ | ✓ | ○ | ✓ | ○ | ✓ | — | ✓ | ✓ | ✓ |
| **010 Obs** | ✓ | ✓ | ✓ | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| **011 Test** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| **012 Migr** | ✓ | ✓ | ✓ | ⚠ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |

**Légende :** ✓ = cohérent · ○ = indépendant · ⚠ = zone de vigilance

### Conclusion

**Aucun conflit architectural direct** n’a été identifié entre les 12 ADR historiques. **ADR-013** est additif (île d’identité M5.1). **ADR-014** est additif (sessions M5.2, jeton haché) et cohérent avec ADR-002 (PostgreSQL) et ADR-005 (sessions serveur + cookies HTTP-only **inchangés**). **ADR-015** est additif (OrganizationContext request-scoped, M5.3) et cohérent avec ADR-014 (session = User only ; pas d’`organization_id` sur `sessions`). **ADR-016** est additif (Learner scopé organisation + ownership Goal) et cohérent avec ADR-013 (User ≠ Learner) et ADR-015 (OrganizationContext request-scoped ; M6 owns learning-object tenancy). **ADR-017** is additive (M6.2 tenant-safe Path persist through owned Goal); it does **not** rewrite ADR-013–016 Decision rows (User ≠ Learner, User-only sessions, OrganizationContext, LearnerContext, Goal as root, public confirm/generate). Keeping confirm/generate public in M6.2 is additive, not a Decision-row rewrite. **ADR-018** is additive (M6.3 tenant-safe Evidence persist through Goal-derived ownership); it **extends** ADR-016’s derived ownership model and ADR-017’s owned-write pattern; it does **not** rewrite ADR-013–017 Decision rows. **M6.1 is implemented and validated. M6.2 is COMPLETE AND VALIDATED. M6.3 is COMPLETE AND VALIDATED.**

### Zones de vigilance

| Zone | ADR impliquées | Risque | Mitigation |
|------|----------------|--------|------------|
| **React/Vite vs prototype legacy** | ADR-004, ADR-012 | Régression UI, double maintenance | Golden E2E ; retrait route par route |
| **AI vs business rules** | ADR-009, ADR-008 | IA mute état sans validation | Validators obligatoires ; Mock par défaut |
| **Drizzle vs Domain purity** | ADR-007, ADR-008 | Fuite ORM dans le domaine | Repository interfaces ; Drizzle en infra only |

---

## 22. Deferred Decisions

Les éléments suivants sont **volontairement non décidés**. Ils ne doivent pas être traités comme des décisions prises.

| # | Sujet | Statut |
|---|-------|--------|
| D-01 | Hébergement PostgreSQL (managed vs self-hosted) | À définir ultérieurement |
| D-02 | Version exacte Node.js LTS cible | À définir ultérieurement |
| D-03 | Cache / Redis (sessions, rate limiting) | À définir ultérieurement |
| D-04 | Fournisseur LLM réel (OpenAI, Anthropic, etc.) | À définir ultérieurement |
| D-05 | Fournisseur IAM externe / SSO enterprise | À définir ultérieurement |
| D-06 | GraphQL (couche API alternative) | Rejeté MVP ; réévaluation V2 si besoin |
| D-07 | Next.js (framework frontend) | Rejeté (ADR-004) ; réévaluation si SSR requis |
| D-08 | Event sourcing complet | À définir ultérieurement |
| D-09 | SSO / SAML / OIDC enterprise | À définir ultérieurement |
| D-10 | API publique (third-party integrations) | À définir ultérieurement |
| D-11 | Librairie session exacte (Lucia, custom…) | À définir ultérieurement |
| D-12 | Component library (Tailwind, shadcn…) | À définir ultérieurement |
| D-13 | Hosting provider (Vercel, Railway, AWS…) | À définir ultérieurement |
| D-14 | Matrice RBAC détaillée par ressource | À définir ultérieurement |
| D-15 | Schéma SQL spine Goal/Path/Steps/Evidence | **Décidé en M4**. Identity island **ADR-013 / M5.1**. Sessions = M5.2. Progress/mastery/skill catalog différés. |
| D-16 | Event bus technology (si nécessaire) | À définir ultérieurement |

---

## 23. Architectural Change Process

### Processus

```mermaid
flowchart LR
  Constraint[Nouvelle contrainte] --> Analysis[Analyse impact]
  Analysis --> ADRImpact[Impact ADR existantes]
  ADRImpact --> Proposal[Proposition documentée]
  Proposal --> Validation[Validation humaine]
  Validation --> ADRUpdate[Nouvelle ou modification ADR]
  ADRUpdate --> Implementation[Implémentation]
```

### Règles

1. Toute contrainte nouvelle (produit, technique, réglementaire) déclenche une **analyse d’impact** sur cette baseline
2. Si une ADR existante est contredite → **proposition de modification ADR** avant tout code
3. La validation humaine est **obligatoire** pour toute modification de baseline
4. Cursor/Codex **peuvent proposer** des changements architecturaux — ils **ne peuvent pas** les appliquer silencieusement
5. Une modification ADR sans validation = violation de la Engineering Constitution (C-11, C-15)

---

## 24. Phase 2.2 Entry Criteria

Les conditions suivantes doivent être remplies **avant** de commencer l’implémentation Phase 2.2 :

| # | Critère | Statut |
|---|---------|--------|
| EC-01 | Baseline documentaire validée humainement | **En attente** (ce document) |
| EC-02 | Repository propre (Phase 1C legacy nettoyé) | Done |
| EC-03 | Tests existants verts (25 unit + 10 E2E + CI) | Done |
| EC-04 | Architecture cible comprise et documentée | Done (ce document) |
| EC-05 | MVP boundaries définies (section 7) | Done |
| EC-06 | First vertical slice défini (section 18) | Done |
| EC-07 | Aucune modification fonctionnelle pendant cette tâche documentaire | Requis |
| EC-08 | 12 ADR validées et cohérentes (section 20–21) | Done |

---

## 25. Architecture Baseline Status

```
Status: BASELINE READY FOR HUMAN VALIDATION
```

### Prochaines étapes

1. **Validation humaine** de ce document par le product owner / architecte
2. Une fois validé → statut passe à **FROZEN**
3. Toute modification post-FROZEN suit le processus section 23
4. Trajectoire : M0–M4 **Done** ; M5.1–M5.3 **Done** ; **ADR-016 Accepted** ; **M6.1 COMPLETE AND VALIDATED** (C1–C7) ; **ADR-017 Accepted** ; **M6.2 COMPLETE AND VALIDATED** (C1–C3 ; FINAL VALIDATION PASS) ; **ADR-018 Accepted** ; **M6.3 COMPLETE AND VALIDATED** (C1–C3 ; FINAL VALIDATION PASS ; 228 executable tests) ; next milestone **NOT STARTED** — separate architecture/readiness review required ; M5 **In progress** (RBAC détaillé différé). Pas de M4.5.

### Ce document ne remplace pas

- [`docs/domain-model.md`](domain-model.md) — détail des entités et règles métier
- [`docs/product-principles.md`](product-principles.md) — principes produit non négociables
- [`docs/migration-map.md`](migration-map.md) — mapping fichier par fichier Prototype → cible
- Phase 1.5 — référentiel produit complet (personas, packaging, critères d’acceptation)

---

*Document produit dans le cadre de la Phase 2.1-B — Architecture Baseline & Decision Record.*  
*Aucune modification de code, configuration ou tests n'a accompagné sa création.*
