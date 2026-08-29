# Learnova — Demo script (3 minutes)

Goal: show the **GPS des compétences** without technical detail.

## Preparation (30 s)

1. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

2. Open the **exact `Local:` URL** shown by Vite (port may differ if 5173 is in use).

3. Clear any previous session: open DevTools → Application → Local Storage → delete `learnova-learner`, or run in console:

   ```js
   localStorage.removeItem('learnova-learner')
   location.reload()
   ```

## Script (~2 min 30)

### 1. Landing — the problem (20 s)

« A LMS says: find a course. Learnova says: tell us where you want to go. »

Show the hero, **Objectif → IA → Parcours personnalisé**, and **LMS vs Learnova**.

CTA: **Construire mon parcours**.

### 2. Goal (25 s)

Question: « Quel objectif souhaitez-vous atteindre ? »

Recommended demo objective (Outlook / e-mail IA):

> J'aimerais apprendre à piloter un projet d'optimisation intelligente de la gestion des e-mails Outlook par l'IA pour cadres d'entreprises.

Or use chip: **Je veux apprendre à utiliser l'IA pour développer mon activité.**

Keep Level = Débutant, 5 h / semaine.

Click **Analyser mon objectif** → wait for confirmation.

Click **Construire mon parcours**.

### 3. Path generation (10 s)

Wait for the roadmap spinner (~1–2 s). Say: « The AI engine is in demo mode — replaceable by a real API later. »

### 4. GPS / Roadmap (30 s)

Show **Votre destination**, personalized steps, and competency labels.

« This is not a catalogue. It's an itinerary. »

CTA: **Commencer mon parcours**.

### 5. Dashboard (15 s)

Show **Ma destination**, **Progression : 0 %**, **Vous êtes ici**, **Prochaine étape**.

CTA: **Continuer mon parcours**.

### 6. Lesson + quiz (45 s)

Read one key concept and the practical example.

Answer the 3 quiz questions (correct answers are index 2 for scenario-based questions — read feedback after submit).

On success: **Compétence validée**.

If score is too low: read feedback, click **Réessayer le quiz**, try again.

CTA: **Continuer vers l'étape 2**.

### 7. Dashboard after validation (15 s)

Show **Progression : 17 %**, step 1 completed, step 2 as current.

### 8. Closing (15 s)

Return to landing. Recap:

- LMS: I search for a course.
- Learnova: I state my goal.
- AI: it builds my path.
- Evidence: I validate before progressing.

« Learnova is the GPS des compétences. »

## If something blocks

| Issue | Fix |
|-------|-----|
| Old path in memory | Clear `learnova-learner` in localStorage |
| Wrong page | Navigate to `#/` |
| Quiz failed | Read review, click **Réessayer le quiz** |
| Wrong port | Use Vite's printed `Local:` URL |

## Automated regression tests

The critical journey is covered by:

```bash
npm run test        # unit tests
npm run test:e2e    # Playwright (includes quiz fail + retry scenarios)
```

First-time E2E setup: `npx playwright install chromium`
