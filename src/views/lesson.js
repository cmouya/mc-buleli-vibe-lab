import { buildFallbackLesson, getLesson } from "../data/lessons.js"
import {
  DEFAULT_PASS_SCORE,
  evaluateQuizSubmission,
  normalizeQuizQuestions,
} from "../shared/assessment.js"
import {
  completeStep,
  getCurrentStep,
  getNextStep,
  getState,
  hasPath,
  labelStatus,
} from "../store.js"

export function renderLesson() {
  const state = getState()
  const step = getCurrentStep()

  if (!state.goal || !hasPath() || !step) {
    return emptyState(
      "Parcours en attente",
      "Construisez votre itinéraire depuis le dashboard pour accéder à une leçon.",
      "#/dashboard",
      "Retour au dashboard",
    )
  }

  if (step.status === "todo") {
    return emptyState(
      "Étape verrouillée",
      "Terminez l'étape en cours avant d'accéder à celle-ci.",
      "#/dashboard",
      "Retour au dashboard",
    )
  }

  const lesson = getLesson(step.id) || buildFallbackLesson(step)
  if (!lesson) {
    return emptyState(
      "Contenu indisponible",
      "Cette étape n'a pas encore de contenu pédagogique.",
      "#/dashboard",
      "Retour au dashboard",
    )
  }

  const alreadyDone = step.status === "done"
  const next = getNextStep()
  const concepts = lesson.keyConcepts || lesson.keyPoints?.map((text, index) => ({
    title: `Concept ${index + 1}`,
    description: text,
  })) || []

  return `
    <section class="panel lesson-header">
      <p class="eyebrow">Module d'apprentissage</p>
      <h1>${escapeHtml(step.title)}</h1>
      <p class="step-meta">
        Étape en cours · Compétence : ${escapeHtml(step.skill || "À valider")}
        · ${escapeHtml(step.level)} · ${escapeHtml(step.duration)}
        · ${escapeHtml(labelStatus(step.status))}
      </p>
    </section>

    <section class="panel lesson-context">
      <h2>Destination</h2>
      <p class="destination destination--compact">${escapeHtml(state.goal)}</p>
    </section>

    <section class="panel lesson">
      <h2>Introduction</h2>
      <p class="lesson__body">${escapeHtml(lesson.introduction || lesson.body || "")}</p>

      <h2>Concepts clés</h2>
      <ol class="concept-list">
        ${concepts
          .map(
            (concept) => `
          <li>
            <strong>${escapeHtml(concept.title)}</strong>
            <p>${escapeHtml(concept.description)}</p>
          </li>`,
          )
          .join("")}
      </ol>

      ${
        lesson.example
          ? `
      <h2>Exemple pratique</h2>
      <article class="lesson-example">
        <h3>${escapeHtml(lesson.example.title)}</h3>
        <p>${escapeHtml(lesson.example.body)}</p>
      </article>`
          : ""
      }

      <h2>À retenir</h2>
      <p class="lesson-takeaway">${escapeHtml(lesson.takeaway || lesson.keyPoints?.join(" ") || "")}</p>
    </section>

    <section class="panel" id="quiz-section">
      ${
        alreadyDone
          ? renderValidatedPanel(step, next)
          : renderQuizPanel(step, lesson)
      }
    </section>

    <section class="panel">
      <div class="actions">
        <a class="btn btn--ghost" href="#/dashboard">Retour au dashboard</a>
      </div>
    </section>
  `
}

function renderQuizPanel(step, lesson) {
  const questions = normalizeQuizQuestions(lesson)
  const passScore = lesson.quiz?.passScore ?? DEFAULT_PASS_SCORE

  return `
    <h2>Quiz de validation</h2>
    <p class="muted">Répondez aux ${questions.length} questions pour valider la compétence. Seuil : ${passScore}/${questions.length} bonnes réponses.</p>
    <form id="quiz-form" class="quiz" novalidate>
      ${questions
        .map(
          (item, qIndex) => `
        <fieldset class="quiz__block">
          <legend>Question ${qIndex + 1} · ${escapeHtml(item.question)}</legend>
          ${item.options
            .map(
              (option, oIndex) => `
            <label class="quiz__option">
              <input type="radio" name="q${qIndex}" value="${oIndex}" required />
              <span>${escapeHtml(option)}</span>
            </label>`,
            )
            .join("")}
        </fieldset>`,
        )
        .join("")}
      <button class="btn btn--primary" type="submit">Valider mes réponses</button>
    </form>
    <div id="quiz-results" data-testid="quiz-results" hidden></div>
  `
}

function renderValidatedPanel(step, next) {
  return `
    <div class="validation-success">
      <p class="eyebrow">Validation</p>
      <h2>Compétence validée</h2>
      <p class="success">Vous avez validé « ${escapeHtml(step.skill || step.title)} ».</p>
      ${
        next
          ? `
        <p class="muted">Prochaine étape : ${escapeHtml(next.title)}</p>
        <div class="actions">
          <a class="btn btn--primary" href="#/dashboard">Continuer vers l'étape ${getStepNumber(next)}</a>
        </div>`
          : `
        <div class="actions">
          <a class="btn btn--primary" href="#/dashboard">Retour au dashboard</a>
        </div>`
      }
    </div>
  `
}

function renderResults({ lesson, step, score, total, passed, details, next }) {
  const passScore = lesson.quiz?.passScore ?? DEFAULT_PASS_SCORE

  if (passed) {
    return `
      <div class="validation-success">
        <p class="eyebrow">Validation</p>
        <h2>Compétence validée</h2>
        <p class="quiz-score">Score : ${score}/${total}</p>
        <p class="success">Bravo — vous maîtrisez les fondamentaux de cette étape.</p>
        <ul class="quiz-review">
          ${details
            .map(
              (item) => `
            <li class="quiz-review__item quiz-review__item--${item.correct ? "ok" : "ko"}">
              <strong>Question ${item.index + 1}</strong>
              <p>${item.correct ? "Correct." : `Incorrect — bonne réponse : ${escapeHtml(item.options[item.answer])}`}</p>
              <p class="muted">${escapeHtml(item.explanation)}</p>
            </li>`,
            )
            .join("")}
        </ul>
        ${
          next
            ? `
          <div class="actions">
            <a class="btn btn--primary" href="#/dashboard" id="continue-btn">Continuer vers l'étape ${getStepNumber(next)}</a>
          </div>`
            : ""
        }
      </div>
    `
  }

  return `
    <div class="validation-retry">
      <h2>Validation non atteinte</h2>
      <p class="quiz-score">Score : ${score}/${total} — seuil requis : ${passScore}/${total}</p>
      <p class="quiz__feedback quiz__feedback--bad">
        Relisez les concepts clés et l'exemple pratique, puis réessayez. La progression se met à jour uniquement après validation.
      </p>
      <ul class="quiz-review">
        ${details
          .map(
            (item) => `
          <li class="quiz-review__item quiz-review__item--${item.correct ? "ok" : "ko"}">
            <strong>Question ${item.index + 1}</strong>
            <p>${item.correct ? "Correct." : `Incorrect — bonne réponse : ${escapeHtml(item.options[item.answer])}`}</p>
            <p class="muted">${escapeHtml(item.explanation)}</p>
          </li>`,
          )
          .join("")}
      </ul>
      <button class="btn btn--primary" type="button" id="retry-quiz">Réessayer le quiz</button>
    </div>
  `
}

export function bindLesson(root, rerender) {
  const step = getCurrentStep()
  if (!step || step.status === "todo" || step.status === "done") {
    return
  }

  const lesson = getLesson(step.id) || buildFallbackLesson(step)
  if (!lesson) {
    return
  }

  const form = root.querySelector("#quiz-form")
  const results = root.querySelector("#quiz-results")
  if (!form || !results) {
    return
  }

  const questions = normalizeQuizQuestions(lesson)
  const passScore = lesson.quiz?.passScore ?? DEFAULT_PASS_SCORE
  const next = getNextStep()

  form.addEventListener("submit", (event) => {
    event.preventDefault()

    const selectedAnswers = questions.map((_, index) => {
      const selected = form.querySelector(`input[name="q${index}"]:checked`)
      return selected ? Number(selected.value) : -1
    })

    const { details, score, total, passed, unanswered } = evaluateQuizSubmission(
      questions,
      selectedAnswers,
      passScore,
    )

    if (unanswered) {
      results.hidden = false
      results.innerHTML = `<p class="quiz__feedback quiz__feedback--bad">Répondez à toutes les questions avant de valider.</p>`
      return
    }

    if (passed) {
      completeStep(step.id)
    }

    form.hidden = true
    results.hidden = false
    results.innerHTML = renderResults({ lesson, step, score, total, passed, details, next })

    if (!passed) {
      results.querySelector("#retry-quiz")?.addEventListener("click", () => {
        rerender?.()
      })
    }
  })
}

function getStepNumber(step) {
  const state = getState()
  const index = state.steps.findIndex((item) => item.id === step.id)
  return index >= 0 ? index + 1 : 2
}

function emptyState(title, note, href, label) {
  return `
    <section class="panel panel--center">
      <p class="eyebrow">Leçon</p>
      <h1>${title}</h1>
      <p class="muted">${note}</p>
      <a class="btn btn--primary" href="${href}">${label}</a>
    </section>
  `
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
