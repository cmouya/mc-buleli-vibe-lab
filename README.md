# Learnova

**Learnova** is a Learning Intelligence prototype — not a traditional LMS with a chatbot. It is a **GPS des compétences**: the learner states a goal, receives a personalized path, learns step by step, and progresses only after demonstrated validation.

> Don't search for a course. Tell us where you want to go.

## Product summary

Learnova inverts the LMS logic:

| Traditional LMS | Learnova |
|-----------------|----------|
| « Which course do you want? » | « What goal do you want to reach? » |
| Content catalogue first | Goal first |
| Completion = consumed | Validation = evidence (quiz) |

**Core chain:**

```
Goal → Roadmap (GPS) → Dashboard → Lesson → Quiz → Validation → Progression
```

Domain principles (see `docs/product-principles.md`):

- Goal before Content
- Skills before Courses
- Evidence before Completion
- Progress is not Mastery

## Current MVP purpose

This repository is **Prototype 0** — a functional hackathon baseline evolving toward Learnova 1.0.

It demonstrates:

- Free-text goal expression
- Simulated goal analysis
- Personalized learning path generation (Mock AI)
- Learner dashboard (navigation console)
- First interactive lesson with quiz validation
- Progress update after successful assessment

No backend, authentication, or real AI API in this MVP.

## Main learning journey

1. **Landing** (`#/`) — value proposition, LMS vs Learnova
2. **Goal** (`#/goal`) — express objective, level, weekly hours
3. **Roadmap** (`#/roadmap`) — GPS itinerary generated from the goal
4. **Dashboard** (`#/dashboard`) — destination, progress, current step, next step
5. **Lesson** (`#/lesson`) — micro-learning content + quiz
6. **Quiz** — 3 questions, threshold 2/3 correct
7. **Validation** — competency validated only if threshold met
8. **Progression** — step completed, next step unlocked (~17% for 1/6 steps)

## Technology stack

| Layer | Technology |
|-------|------------|
| UI | Vanilla JavaScript (ES modules) |
| Build | Vite 7 |
| Routing | Hash router (`#/goal`, `#/roadmap`, …) |
| State | `localStorage` (`learnova-learner`) |
| AI (demo) | `MockAIService` — local, deterministic |
| Unit tests | Vitest + jsdom |
| E2E tests | Playwright (Chromium) |
| Domain contracts | TypeScript (`src/shared/types/`, not wired to runtime) |

Architecture documentation: [`docs/architecture.md`](docs/architecture.md)

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
| `npm run typecheck` | TypeScript strict check (`src/shared/types/`) |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright + dev server) |

## Testing architecture

```
tests/
  unit/           # Vitest — store, assessment, MockAIService
  e2e/            # Playwright — critical user journeys
```

- **Vitest** — progression logic, quiz scoring, path generation
- **Playwright** — full browser journey (Landing → Progression)
- **TypeScript** — domain type contracts in `src/shared/types/` (Phase 0 foundation)

Run all checks locally:

```bash
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

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

## Roadmap (not in this MVP)

- Next.js + TypeScript runtime migration (future phase)
- Backend, database, authentication
- Real AI provider, Skill Graph, Mastery model
- Mentor IA UI (contract exists, not wired)
