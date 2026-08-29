# Migration map — Prototype 0 → Learnova

Matrice de migration **progressive**. Aucun fichier n’est déplacé en Phase 0.

**Légende actions :** `KEEP` conserver tel quel · `ARCHIVE` documenter puis retirer · `EXTRACT` extraire logique vers module · `MIGRATE` porter vers Next.js · `REPLACE` remplacer par nouvelle implémentation

---

## Fichiers racine

| Fichier actuel | Responsabilité actuelle | Module cible | Action future | Phase |
|----------------|------------------------|--------------|---------------|-------|
| `index.html` | Point d’entrée HTML Vite | `apps/prototype` ou racine Next | KEEP puis MIGRATE | 4 |
| `package.json` | Scripts Vite | Monorepo / Next app | KEEP, étendre scripts | 2 |
| `README.md` | Doc hackathon | `docs/` + README produit | REPLACE contenu | 1 |
| `DEMO.md` | Script démo jury | `docs/demo-script.md` | REPLACE aligné code | 1 |
| `.gitignore` | Exclusions git | Racine monorepo | KEEP | 0 |

---

## Bootstrap & infrastructure

| Fichier actuel | Responsabilité actuelle | Module cible | Action future | Phase |
|----------------|------------------------|--------------|---------------|-------|
| `src/main.js` | Bootstrap, shell UI, dispatch vues | `components/` layout + Next layout | KEEP → MIGRATE | 4 |
| `src/router.js` | Hash routing | Next.js App Router | KEEP → REPLACE | 4 |
| `src/store.js` | État apprenant, path, progression | `learner/` + `learning-path/` | EXTRACT → modules TS | 2–3 |
| `src/style.css` | Design system CSS | Tailwind + tokens | KEEP → MIGRATE tokens | 3–4 |

---

## Couche AI

| Fichier actuel | Responsabilité actuelle | Module cible | Action future | Phase |
|----------------|------------------------|--------------|---------------|-------|
| `src/ai/AIService.js` | Contrat moteur IA | `ai/providers/` (interface) | EXTRACT interface TS | 2 |
| `src/ai/MockAIService.js` | Génération path mock, askMentor | `ai/providers/mock` + `ai/tasks/` | EXTRACT matchers/templates | 3 |
| `src/ai/index.js` | Factory getAIService() | `ai/` DI / factory | EXTRACT | 2 |

---

## Données & contenu

| Fichier actuel | Responsabilité actuelle | Module cible | Action future | Phase |
|----------------|------------------------|--------------|---------------|-------|
| `src/data/lessons.js` | Leçons + quiz statiques | `content/` | EXTRACT schéma unifié, split fichiers | 3 |
| — | — | `content/activities/` | CREATE | 3 |

---

## Vues actives (runtime)

| Fichier actuel | Responsabilité actuelle | Module cible | Action future | Phase |
|----------------|------------------------|--------------|---------------|-------|
| `src/views/landing.js` | Landing page | `app/page` + `components/marketing` | KEEP → MIGRATE | 4 |
| `src/views/goal.js` | Expression objectif | `goals/` + page `/goal` | KEEP → EXTRACT domaine puis MIGRATE | 2–4 |
| `src/views/roadmap.js` | GPS + génération path | `learning-path/` + page `/roadmap` | KEEP → EXTRACT bindRoadmap | 3–4 |
| `src/views/dashboard.js` | Console apprenant | `analytics/` + `learner/` + page | KEEP → MIGRATE | 4 |
| `src/views/lesson.js` | Leçon + quiz + validation | `content/` + `assessment/` + page | KEEP → EXTRACT quiz logic | 3–4 |

---

## Vues legacy (supprimées Phase 1C)

| Fichier (historique) | Responsabilité | Module cible | Action | Phase |
|----------------------|----------------|--------------|--------|-------|
| `src/views/diagnostic.js` | Ancien formulaire objectif (`#/objectif`) | `goals/` | REMOVED ✅ | 1C |
| `src/views/generating.js` | Ancien écran génération (`#/generation`) | `learning-path/` | REMOVED ✅ | 1C |
| `src/views/path.js` | Ancien GPS + `#/lecon/:id` | `learning-path/` | REMOVED ✅ | 1C |
| `src/views/placeholders.js` | Placeholders hackathon | — | REMOVED ✅ | 1C |

Fonctionnalités remplacées par : `goal.js`, `roadmap.js`, `lesson.js`. Historique git conservé.

---

## Nouveaux modules (à créer — pas en Phase 0 runtime)

| Chemin cible | Responsabilité | Action | Phase |
|--------------|----------------|--------|-------|
| `src/modules/learner/` | Profil, session, repository | CREATE | 2 |
| `src/modules/goals/` | Goal lifecycle, analyse | CREATE | 2 |
| `src/modules/skills/` | Skill graph, competency | CREATE | 3 |
| `src/modules/learning-path/` | Path generation, steps | CREATE | 2–3 |
| `src/modules/content/` | Activities, lessons | CREATE | 3 |
| `src/modules/assessment/` | Quiz, evidence, rules | CREATE | 3 |
| `src/modules/analytics/` | Progress, insights, NBA | CREATE | 4 |
| `src/ai/providers/` | IA adapters | CREATE | 2 |
| `src/ai/prompts/` | Prompt templates | CREATE | 3 |
| `src/ai/tasks/` | Use cases IA | CREATE | 2 |
| `src/ai/validators/` | Règles post-IA | CREATE | 2 |
| `src/components/` | UI réutilisable | CREATE | 3–4 |
| `src/shared/` | Types, utils, constants | CREATE (types Phase 0) | 0–2 |

---

## Documentation (Phase 0 — créée)

| Fichier | Responsabilité | Action | Phase |
|---------|----------------|--------|-------|
| `docs/vision.md` | Vision produit | CREATE ✅ | 0 |
| `docs/architecture.md` | Architecture | CREATE ✅ | 0 |
| `docs/domain-model.md` | Modèle domaine | CREATE ✅ | 0 |
| `docs/product-principles.md` | Principes | CREATE ✅ | 0 |
| `docs/migration-map.md` | Ce document | CREATE ✅ | 0 |

---

## Contrats TypeScript (Phase 0 — créés, non branchés)

| Fichier | Responsabilité | Action | Phase |
|---------|----------------|--------|-------|
| `src/shared/types/learner.types.ts` | Contrats Learner | CREATE ✅ | 0 |
| `src/shared/types/domain.types.ts` | Contrats domaine | CREATE ✅ | 0 |
| `tsconfig.json` | Config TS strict | CREATE ✅ | 0 |

---

## Fonctions store.js → modules (extraction future)

| Fonction actuelle | Module cible | Phase |
|-------------------|--------------|-------|
| `setProfile`, `setAnalyzed` | `goals/` + `learner/` | 2 |
| `setPath`, `hasPath` | `learning-path/` | 2 |
| `getCurrentStep`, `getNextStep`, `completeStep` | `learning-path/` | 2 |
| `getProgressPercent`, `getCompletedCompetenciesCount` | `analytics/` + `learning-path/` | 3 |
| `loadState`, `saveState` | `learner/` (repository adapter) | 2 |
| `label*` helpers | `shared/` | 2 |

---

## Ordre de migration recommandé

```
Phase 0  docs + types (non branchés)                    ← ACTUEL
Phase 1  tests e2e + archive legacy + README (1C: legacy views removed)
Phase 2  extract store → modules TS + ai/validators
Phase 3  content + assessment modules + unify lesson schema
Phase 4  Next.js routes + Tailwind + retire Vite (quand parity)
```

---

## Règles de migration

1. **Ne jamais migrer** sans test e2e vert sur le parcours nominal.
2. **Extraire avant de déplacer** — logique pure TS testable d’abord.
3. **Une route à la fois** vers Next.js.
4. **Prototype Vite** reste runnable jusqu’à bascule explicite.
