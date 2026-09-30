# Learnova

**Learnova** is a **Learning Intelligence System (LIS)** under development. It is a **GPS des compétences**: the learner states a goal, follows a learning path, and produces evidence. Its defining value is goal-driven intelligence and orchestration toward demonstrated mastery and measurable outcomes.

Canonical reference: [Product Positioning](docs/product-positioning.md). Learnova targets complementarity with existing LMS ecosystems, enterprise interoperability, Skills Intelligence, AI Governance, and configurable African contextualisation within a globally usable system. These targets are not claims of current integration or advanced adaptation.

> Don't search for a course. Tell us where you want to go.

## Product summary

Learnova starts with a goal. This comparison describes product emphasis, not every LMS:

| Traditional LMS | Learnova |
|-----------------|----------|
| « Which course do you want? » | « What goal do you want to reach? » |
| Content catalogue first | Goal first |
| Completion = consumed | Validation = evidence (quiz) |

**Current demo chain** (progress is not mastery):

```
Goal → Roadmap (GPS) → Dashboard → Lesson → Quiz → Validation → Progression
```

Domain principles (see `docs/product-principles.md`):

- Goal before Content
- Skills before Courses
- Evidence before Completion
- Progress is not Mastery

## Current MVP purpose

**CURRENT:** The Golden Reference UI is still the Vite app on `localStorage`. The server includes M0–M4 foundations, M5.1–M5.3 identity/session/tenant context, M6.1–M6.4 owned learning persistence and derived Completion/Progress, and Skill Identity plus required proficiency and explicit Evidence attribution writes.

Trusted-scoring Slices 1–3 are **CURRENT** at `ae6e5a6`: pure scorer, quiz persistence/provenance, and selections-only trusted submission with keyed-step legacy rejection. Validated through unit, API and PostgreSQL integration tests. Unkeyed submissions remain `client_declared`; trusted submissions persist `server_recalculated`. Mastery projection remains unimplemented and gated by ADR-022. This records local validation, not production deployment. See the [capability ledger](docs/product-positioning.md#current-capability-ledger).

It demonstrates:

- Free-text goal expression
- Simulated goal analysis
- Personalized learning path generation (Mock AI)
- Learner dashboard (navigation console)
- First interactive lesson with quiz validation
- Progress update after successful assessment (browser only)

The learner UI does **not** dual-write to PostgreSQL. HTTP auth exists (`POST /api/v1/auth/login`) with an HTTP-only cookie; the Golden Reference UI does not use it. M5.1 identity and M5.2 sessions live in PostgreSQL. Decisions: [`docs/m5-decisions.md`](docs/m5-decisions.md), [`docs/m5.2-decisions.md`](docs/m5.2-decisions.md).

## Main learning journey

1. **Landing** (`#/`) — value proposition, LMS vs Learnova
2. **Goal** (`#/goal`) — express objective, level, weekly hours
3. **Roadmap** (`#/roadmap`) — GPS itinerary generated from the goal
4. **Dashboard** (`#/dashboard`) — destination, progress, current step, next step
5. **Lesson** (`#/lesson`) — micro-learning content + quiz
6. **Quiz** — 3 questions, threshold 2/3 correct
7. **Validation** — demo activity passes only if its threshold is met; this does not establish Skill Mastery
8. **Progression** — step completed, next step unlocked (~17% for 1/6 steps)

## Technology stack

| Layer | Technology |
|-------|------------|
| UI (Golden Reference) | Vanilla JavaScript (ES modules) |
| Build | Vite 7 |
| Routing | Hash router (`#/goal`, `#/roadmap`, …) |
| Learner state (UI) | `localStorage` (`learnova-learner`) |
| API | Fastify + OpenAPI (`/api/v1/`) |
| Persistence (server) | PostgreSQL + Drizzle (`goals`, paths, steps, `evidence`) |
| AI (demo) | `MockAIService` — local, deterministic |
| Unit / API / DB tests | Vitest |
| E2E tests | Playwright (Chromium) |
| Domain | TypeScript modules (`src/modules/`) |

Architecture: [`docs/architecture-baseline.md`](docs/architecture-baseline.md) (stages). Golden Reference snapshot: [`docs/architecture.md`](docs/architecture.md).

## Installation

```bash
npm install
```

### Playwright (first time, for E2E tests)

```bash
npx playwright install chromium
```

## Development

```bash
npm run dev
```

**Important — Vite port:** the dev server uses port **5173** by default. If that port is busy, Vite picks the next free port (5174, 5175, …).

Always use the exact **`Local:`** URL printed in the terminal, for example:

```
➜  Local:   http://localhost:5176/
```

Do not assume `http://localhost:5173` unless Vite shows it.

## Available commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:api` | Fastify API tests (`inject()`) |
| `npm run test:db` | PostgreSQL + Drizzle tests (`DATABASE_URL`) |
| `npm run test:e2e` | End-to-end tests (Playwright + dev server) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply Drizzle migrations |

## Testing architecture

```
tests/
  unit/           # Vitest — domain, application, store, MockAI
  api/            # Fastify inject()
  db/             # real PostgreSQL
  e2e/            # Playwright — Golden Reference journeys
```

- **Vitest** — domain rules, quiz scoring, persist wrappers, path generation
- **Playwright** — full browser journey (Landing → Progression)
- **PostgreSQL tests** — Goal / Path / Evidence repositories (CI service)

Run checks locally:

```bash
npm run typecheck
npm run test
npm run test:api
npm run build
npm run test:e2e
```

`npm run test:db` needs PostgreSQL and `DATABASE_URL` (CI provides this).

CI runs the same pipeline on push and pull requests (see `.github/workflows/ci.yml`).

## Mock AI mode

`MockAIService` generates paths from goal keywords (no external API):

- IA + activité → `ia-pro`
- Data Analyst → `data-analyst`
- Outlook / e-mail + IA → `outlook-email-ia`
- Other objectives → generic path derived from goal text

To connect a real provider later: implement `AIService` on the **server** and replace `getAIService()`.

## Project structure

```
src/
  main.js, router.js, store.js
  ai/                 AIService contract + MockAIService
  data/lessons.js     Lesson + quiz content
  shared/             assessment.js, types/
  views/              landing, goal, roadmap, dashboard, lesson
docs/                 Product & architecture foundation (Phase 0)
tests/unit/           Vitest
tests/e2e/            Playwright
```

## Demo script

See [DEMO.md](DEMO.md) for a 3-minute live demo walkthrough.

## Accepted architecture and target roadmap

- **ACCEPTED / FROZEN:** React + TypeScript + Vite UI migration (ADR-004); trusted submission authority (ADR-023); Mastery constraints (ADR-021/022). Trusted-scoring Slices 1–3 are CURRENT; the UI migration and Mastery projection remain unimplemented.
- **TARGET:** LMS complementarity, enterprise interoperability, institutional AI governance, configurable African-context learning, and measurable learning outcomes.
- **EXPLORATORY / DEFERRED:** Real AI provider choice, Skill Graph/prerequisites, advanced adaptation policies, and Mentor IA UI (contract exists, not wired).

Backend, database adapters, and session authentication already exist. See [Product Positioning](docs/product-positioning.md) and [Architecture Baseline](docs/architecture-baseline.md) before extending the product.
