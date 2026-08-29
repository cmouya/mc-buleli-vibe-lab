# Architecture — Learnova

## État des lieux : Prototype 0

### Stack actuelle

| Couche | Technologie |
|--------|-------------|
| UI | JavaScript vanilla, HTML strings, CSS custom properties |
| Build | Vite 7 |
| Routing | Hash router maison (`#/goal`, `#/roadmap`, …) |
| État | Module singleton `store.js` |
| Persistance | `localStorage` (`learnova-learner`) |
| IA | `MockAIService` via factory `getAIService()` |

### Structure actuelle

```
src/
  main.js              # Bootstrap, shell, dispatch vues
  router.js            # Hash navigation
  store.js             # État apprenant + progression
  style.css            # Design system monolithique
  ai/
    AIService.js       # Contrat
    MockAIService.js   # Implémentation démo
    index.js           # Factory
  data/
    lessons.js         # Contenus + quiz statiques
  views/
    landing.js         # Actif
    goal.js            # Actif
    roadmap.js         # Actif
    dashboard.js       # Actif
    lesson.js          # Actif
```

### Flux runtime Prototype 0

```
main.js → loadState() → initRouter(render)
  → renderX() (HTML) → innerHTML → bindX() (events)
```

Génération parcours : `roadmap.js` → `getAIService().generatePath()` → `setPath()`.

Validation : `lesson.js` → quiz → `completeStep()` si seuil atteint.

---

## Stratégie de coexistence Vite → Next.js

**Principe : Strangler Fig Pattern**

1. **Prototype Vite** reste la référence fonctionnelle jusqu’à parity route par route.
2. **Next.js** sera introduit en **Phase 2+**, en application parallèle ou migration incrémentale — **pas en Phase 0**.
3. Aucun remplacement big-bang du router ou du store tant que les tests e2e du parcours nominal ne couvrent pas la régression.
4. La logique métier sera extraite en **modules TypeScript purs** testables, consommables d’abord par Vite (Phase 2), puis par Next.js.

```
Phase 0   Documentation + contrats TS (non branchés)
Phase 1   Tests e2e Vite + stabilisation baseline
Phase 2   Modules TS + Next.js POC (1 route)
Phase 3+  Migration progressive des routes et UI
```

---

## Architecture cible : Modular Monolith

Un **seul déploiement**, organisé en **bounded contexts** (DDD) avec dépendances unidirectionnelles :

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│         (Next.js App Router — cible future)              │
│         Components / Pages / Layouts                     │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Application Layer                      │
│              Use cases, orchestration                    │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                     Domain Modules                       │
│  learner │ goals │ skills │ learning-path │ content     │
│  assessment │ analytics                                  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                      AI Layer                            │
│  providers │ prompts │ tasks │ validators                │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   Infrastructure                         │
│  Persistence (localStorage → API → DB, futur)            │
└─────────────────────────────────────────────────────────┘
```

**Pas de microservices** : communication in-process entre modules, interfaces explicites.

---

## Bounded contexts

### `learner`

- Profil apprenant, préférences, session.
- **Prototype 0 :** `store.js` (goal, level, hoursPerWeek, intent, skills[]).

### `goals`

- Expression, analyse et confirmation d’objectif.
- **Prototype 0 :** `goal.js`, `setProfile()`, `setAnalyzed()`.

### `skills`

- Référentiel compétences, états de maîtrise (vision).
- **Prototype 0 :** `steps[].skill`, `skills[]` (liste plate).

### `learning-path`

- Génération, stockage et progression du parcours.
- **Prototype 0 :** `MockAIService`, `setPath()`, `completeStep()`, `roadmap.js`, `dashboard.js`.

### `content`

- Activités d’apprentissage, leçons, ressources.
- **Prototype 0 :** `data/lessons.js`, rendu contenu dans `lesson.js`.

### `assessment`

- Quiz, scoring, evidence, règles de validation.
- **Prototype 0 :** logique quiz inline dans `lesson.js`, seuil 2/3.

### `analytics`

- Progression, insights, next best action (vision).
- **Prototype 0 :** `getProgressPercent()`, stats dashboard.

---

## Couche AI

Structure cible sous `src/ai/` :

```
ai/
  providers/       # MockProvider, OpenAIProvider (futur, serveur)
  prompts/         # Templates versionnés par tâche
  tasks/           # generatePath, analyzeGoal, askMentor, adaptPath
  validators/      # Règles post-IA (seuil, cohérence parcours)
```

### Responsabilités

| Dossier | Rôle |
|---------|------|
| `providers` | Adapters vers LLM ou mock ; implémentent interfaces |
| `prompts` | Contenu des prompts ; séparé du code orchestration |
| `tasks` | Cas d’usage IA (generatePath, etc.) |
| `validators` | Application des règles domaine sur sorties IA |

**Prototype 0 :** `AIService.js` + `MockAIService.js` + `index.js` — préfigureront `providers/` et `tasks/`.

**Règle :** les tasks IA ne mutent pas l’état directement ; elles retournent des propositions validées par le domaine.

---

## Principes d’évolution progressive

1. **Documenter avant de déplacer** — Phase 0 (ce document, domain-model, migration-map).
2. **Tester avant de migrer** — Phase 1 e2e sur parcours Vite.
3. **Extraire le domaine avant l’UI** — modules TS purs, sans framework.
4. **Une route à la fois** — Next.js POC puis migration séquentielle.
5. **Design tokens** — porter `style.css` vers Tailwind sans changer l’identité visuelle.
6. **Pas de DB tant que le modèle domaine n’est pas stabilisé** — adapter pattern sur localStorage puis API.

---

## Mapping Prototype 0 → cible (aperçu)

| Prototype 0 | Module cible |
|-------------|--------------|
| `store.js` | `learner` + `learning-path` |
| `goal.js` | `goals` |
| `MockAIService.js` | `ai/tasks` + `learning-path` |
| `lessons.js` | `content` |
| Quiz dans `lesson.js` | `assessment` |
| `dashboard.js` stats | `analytics` |
| `views/*.js` | `components/` + pages Next.js (futur) |

Voir `migration-map.md` pour le détail fichier par fichier.

---

## Stack cible (non implémentée en Phase 0)

| Technologie | Rôle | Phase |
|-------------|------|-------|
| TypeScript strict | Typage domaine + app | 0 (contrats), 2+ (runtime) |
| Next.js App Router | UI, SSR/SSG, routing | 2+ |
| Tailwind CSS | Styles utility + tokens | 3+ |
| Backend API | Persistance, IA serveur | 4+ |
| Base de données | Learner Twin, historique | 4+ |

**Phase 0 ne crée pas Next.js.**
