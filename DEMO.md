# Learnova — Controlled local demo (3–4 minutes)

Show a goal-driven Learning Intelligence System prototype. This UI uses prepared path templates and calculates quiz results in the browser. Server-side trusted scoring exists separately; this UI does not call it.

## Preparation

1. Run `npm install` if dependencies are missing, then `npm run dev`.
2. Open the exact **Local:** URL printed by Vite.
3. Reset only this demo's browser state in DevTools:

   ```js
   localStorage.removeItem('learnova-learner')
   sessionStorage.removeItem('learnova-ui-lang')
   location.hash = '#/'
   location.reload()
   ```

Use the **Outlook scenario below**, through its first lesson and the return to the dashboard. Other predefined lessons include single-question quizzes with a two-answer threshold and are outside this demonstration. S2.1 does not fix those quizzes.

FR/EN translates interface commands. Path and lesson content remains French. Choose the language before entering the goal; switching during an activity can discard unsaved input.

## Script

### 1. Landing — 25 seconds

Show the persistent local-demo notice and **Objectif → Compétences visées → Parcours préparé** / **Goal → Target skills → Prepared path**.

“Learnova starts with a professional goal. This demonstration proposes a path from prepared templates. Complementing existing LMS platforms is a target; integrations remain to be developed.”

Click **Construire mon parcours** / **Build my path**.

### 2. Goal and confirmation — 35 seconds

Enter this exact goal in either interface language:

> J'aimerais apprendre à piloter un projet d'optimisation intelligente de la gestion des e-mails Outlook par l'IA pour cadres d'entreprises.

Keep the self-reported starting level at beginner and the available time at five hours per week.

Click **Vérifier mon objectif** / **Review my goal**. Explain that the summary repeats the entered information; it is not a skill-gap diagnosis. Confirm with **Construire mon parcours** / **Build my path**.

### 3. Roadmap — 25 seconds

Show the goal, proposed steps and target skills. The deterministic local engine selects a prepared path using goal keywords; no external AI model is called.

Click **Commencer mon parcours** / **Start my path**.

### 4. Dashboard — 15 seconds

Show zero progress, the self-reported level and the current step. Progress counts completed steps, not acquired skills.

Click **Continuer mon parcours** / **Continue my path**.

### 5. First Outlook lesson and quiz — 60–90 seconds

Read one concept and its practical example. Explain that the learner must submit quiz answers before the step can finish.

For the optional failure demonstration, select the first option for each of the three questions. Submit, show that the step remains current, and click **Réessayer le quiz** / **Retry the quiz**.

For success, select the **second option for each question** (zero-based index `1`). Submit with **Valider mes réponses** / **Submit my answers**.

Show **Quiz réussi** / **Quiz passed** and the score. This confirms success on this activity, not demonstrated skill mastery. This local prototype includes correction feedback; it is not the trusted server UI.

Click **Continuer vers l'étape 2** / **Continue to step 2**.

### 6. Progress and closing — 30 seconds

Show **17%**, one completed step and the next current step. Stop before opening further lessons.

“Evidence from the quiz gates progression in this local prototype. The separate server implementation accepts answer selections and calculates trusted results with ownership checks. Connecting this UI to that implementation remains future work. Mastery, enterprise integrations and institutional impact measurement are not demonstrated here.”

If technical evidence is requested, refer separately to the existing API and PostgreSQL validation records in `docs/trusted-quiz-scoring-implementation-plan.md`. Do not describe the browser attempt as a persisted trusted server submission.

## Recovery

| Issue | Action |
|---|---|
| Previous learner state | Repeat the scoped reset above |
| Wrong page | Return to `#/` |
| Failed quiz | Read feedback and retry |
| Wrong port | Use Vite's printed Local URL |
| Unexpected path or lost input | Reset and restart the exact Outlook scenario |

## Validation and limits

Existing regression checks:

```bash
npm run test
npm run test:e2e
```

First-time browser setup, if needed: `npx playwright install chromium`.

S2.1 aligns visible claims. It does not establish full bilingual content, accessibility compliance, production readiness or readiness for an AfDB presentation. Those require separate follow-up work.
