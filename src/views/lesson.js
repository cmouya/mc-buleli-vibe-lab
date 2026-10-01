import { buildFallbackLesson, getLesson } from "../data/lessons.js"
import { t } from "../i18n/index.js"
import {
  DEFAULT_PASS_SCORE,
  evaluateQuizSubmission,
  normalizeQuizQuestions,
} from "../shared/assessment.js"
import { getCurrentStep, getNextStep, getState, hasPath, submitQuizAttempt } from "../store.js"

let viewState = null

export function resetLessonState() { viewState = null }

function lessonState() {
  const state = getState()
  if (!viewState || viewState.state !== state || viewState.steps !== state.steps) {
    viewState = { state, steps: state.steps, step: getCurrentStep(), answers: [], missing: [], result: null }
  }
  return viewState
}

function resultHtml(ui, lesson) {
  const questions = normalizeQuizQuestions(lesson)
  const details = ui.result.details.map(item => ({ ...questions[item.index], ...item }))
  return renderResults({ lesson, step: ui.step, ...ui.result, details })
}

export function renderLesson() {
  const state = getState()
  const ui = lessonState()
  const step = ui.step

  if (!state.goal || !hasPath() || !step) {
    return emptyState(
      t("lesson.waitingTitle"),
      t("lesson.waitingNote"),
      "#/dashboard",
      t("lesson.waitingCta"),
    )
  }

  if (step.status === "todo") {
    return emptyState(
      t("lesson.lockedTitle"),
      t("lesson.lockedNote"),
      "#/dashboard",
      t("lesson.lockedCta"),
    )
  }

  const lesson = getLesson(step.id) || buildFallbackLesson(step)
  if (!lesson) {
    return emptyState(
      t("lesson.unavailableTitle"),
      t("lesson.unavailableNote"),
      "#/dashboard",
      t("lesson.unavailableCta"),
    )
  }

  const alreadyDone = step.status === "done"
  const next = getNextStep()
  const concepts = conceptsForDisplay(lesson)

  return `
    <section class="panel lesson-header">
      <p class="eyebrow" data-testid="lesson-eyebrow">${t("lesson.eyebrow")}</p>
      <h1>${escapeHtml(step.title)}</h1>
      <p class="step-meta">
        ${t("lesson.inProgress", {
          skill: escapeHtml(step.skill || t("lesson.skillFallback")),
          level: escapeHtml(step.level),
          duration: escapeHtml(step.duration),
          status: t(`status.${step.status}`),
        })}
      </p>
    </section>

    <section class="panel lesson-context">
      <h2>${t("lesson.destination")}</h2>
      <p class="destination destination--compact">${escapeHtml(state.goal)}</p>
    </section>

    <section class="panel lesson">
      <h2>${t("lesson.intro")}</h2>
      <p class="lesson__body">${escapeHtml(lesson.introduction || lesson.body || "")}</p>

      <h2>${t("lesson.concepts")}</h2>
      <ol class="concept-list">
        ${concepts
          .map(
            (concept) => `
          <li>
            <strong>${escapeHtml(concept.heading)}</strong>
            <p>${escapeHtml(concept.body)}</p>
          </li>`,
          )
          .join("")}
      </ol>

      ${
        lesson.example
          ? `
      <h2>${t("lesson.example")}</h2>
      <article class="lesson-example">
        <h3>${escapeHtml(lesson.example.title)}</h3>
        <p>${escapeHtml(lesson.example.body)}</p>
      </article>`
          : ""
      }

      <h2>${t("lesson.takeaway")}</h2>
      <p class="lesson-takeaway">${escapeHtml(lesson.takeaway || lesson.keyPoints?.join(" ") || "")}</p>
    </section>

    <section class="panel" id="quiz-section">
      ${ui.result ? `<div id="quiz-results" data-testid="quiz-results">${resultHtml(ui, lesson)}</div>` : alreadyDone ? renderValidatedPanel(step, next) : renderQuizPanel(step, lesson)}
    </section>

    <section class="panel">
      <div class="actions">
        <a class="btn btn--ghost" href="#/dashboard">${t("lesson.backDashboard")}</a>
      </div>
    </section>
  `
}

function conceptsForDisplay(lesson) {
  if (Array.isArray(lesson.keyConcepts) && lesson.keyConcepts.length) {
    return lesson.keyConcepts.map((concept, index) => ({
      heading: t("lesson.conceptFallback", { n: index + 1 }),
      body: [concept.title, concept.description].filter(Boolean).join(" — "),
    }))
  }
  if (Array.isArray(lesson.keyPoints) && lesson.keyPoints.length) {
    return lesson.keyPoints.map((text, index) => ({
      heading: t("lesson.conceptFallback", { n: index + 1 }),
      body: text,
    }))
  }
  return []
}

function renderQuizPanel(step, lesson) {
  const ui = lessonState()
  const questions = normalizeQuizQuestions(lesson)
  const passScore = lesson.quiz?.passScore ?? DEFAULT_PASS_SCORE

  return `
    <h2>${t("lesson.quizTitle")}</h2>
    <p class="muted">${t("lesson.quizLead", { count: questions.length, pass: passScore })}</p>
    <form id="quiz-form" class="quiz" novalidate>
      ${questions
        .map(
          (item, qIndex) => `
        <fieldset class="quiz__block">
          <legend>${t("lesson.questionPrefix", { n: qIndex + 1 })} · ${escapeHtml(item.question)}</legend>
          ${item.options
            .map(
              (option, oIndex) => `
            <label class="quiz__option">
              <input type="radio" name="q${qIndex}" value="${oIndex}" required ${ui.answers[qIndex] === oIndex ? "checked" : ""} ${ui.missing.includes(qIndex) ? `aria-invalid="true" aria-describedby="quiz-error-${qIndex}"` : ""} />
              <span>${escapeHtml(option)}</span>
            </label>`,
            )
            .join("")}
          <p id="quiz-error-${qIndex}" class="quiz__feedback quiz__feedback--bad" ${ui.missing.includes(qIndex) ? "" : "hidden"}>${t("lesson.questionUnanswered", { n: qIndex + 1 })}</p>
        </fieldset>`,
        )
        .join("")}
      <button class="btn btn--primary" type="submit" data-testid="quiz-submit">${t("lesson.submit")}</button>
    </form>
    <div id="quiz-results" data-testid="quiz-results" hidden></div>
  `
}

function renderValidatedPanel(step, next) {
  return `
    <div class="validation-success">
      <p class="eyebrow">${t("lesson.validation")}</p>
      <h2>${t("lesson.skillValidated")}</h2>
      <p class="success">${t("lesson.youValidated", { skill: escapeHtml(step.skill || step.title) })}</p>
      ${
        next
          ? `
        <p class="muted">${t("lesson.nextStep", { title: escapeHtml(next.title) })}</p>
        <div class="actions">
          <a class="btn btn--primary" href="#/dashboard">${t("lesson.continueStep", { n: getStepNumber(next) })}</a>
        </div>`
          : `
        <div class="actions">
          <a class="btn btn--primary" href="#/dashboard">${t("lesson.backDashboard")}</a>
        </div>`
      }
    </div>
  `
}

function renderResults({ lesson, step, score, total, passed, details, next, passScore }) {

  if (passed) {
    return `
      <div class="validation-success">
        <p class="eyebrow">${t("lesson.validation")}</p>
        <h2 id="quiz-result-heading" tabindex="-1" aria-describedby="quiz-result-score">${t("lesson.skillValidated")}</h2>
        <p id="quiz-result-score" class="quiz-score">${t("lesson.score", { score, total })}</p>
        <p class="success">${t("lesson.bravo")}</p>
        <ul class="quiz-review">
          ${details
            .map(
              (item) => `
            <li class="quiz-review__item quiz-review__item--${item.correct ? "ok" : "ko"}">
              <strong>${t("lesson.questionPrefix", { n: item.index + 1 })}</strong>
              <p>${item.correct ? t("lesson.correct") : t("lesson.incorrect", { answer: escapeHtml(item.options[item.answer]) })}</p>
              <p class="muted">${escapeHtml(item.explanation)}</p>
            </li>`,
            )
            .join("")}
        </ul>
        ${
          next
            ? `
          <div class="actions">
            <a class="btn btn--primary" href="#/dashboard" id="continue-btn">${t("lesson.continueStep", { n: getStepNumber(next) })}</a>
          </div>`
            : ""
        }
      </div>
    `
  }

  return `
    <div class="validation-retry">
      <h2 id="quiz-result-heading" tabindex="-1" aria-describedby="quiz-result-score">${t("lesson.notReached")}</h2>
      <p id="quiz-result-score" class="quiz-score">${t("lesson.failScore", { score, total, pass: passScore })}</p>
      <p class="quiz__feedback quiz__feedback--bad">
        ${t("lesson.retryLead")}
      </p>
      <ul class="quiz-review">
        ${details
          .map(
            (item) => `
          <li class="quiz-review__item quiz-review__item--${item.correct ? "ok" : "ko"}">
              <strong>${t("lesson.questionPrefix", { n: item.index + 1 })}</strong>
              <p>${item.correct ? t("lesson.correct") : t("lesson.incorrect", { answer: escapeHtml(item.options[item.answer]) })}</p>
              <p class="muted">${escapeHtml(item.explanation)}</p>
            </li>`,
          )
          .join("")}
      </ul>
      <button class="btn btn--primary" type="button" id="retry-quiz">${t("lesson.retry")}</button>
    </div>
  `
}

export function bindLesson(root, rerender) {
  const ui = lessonState()
  const step = ui.step
  if (ui.result) {
    root.querySelector("#retry-quiz")?.addEventListener("click", () => {
      ui.answers = []
      ui.missing = []
      ui.result = null
      rerender?.()
      document.querySelector('#quiz-form input[type="radio"]')?.focus()
    })
    return
  }
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

  function markQuestion(index, invalid) {
    ui.missing = ui.missing.filter(item => item !== index)
    if (invalid) ui.missing.push(index)
    const error = form.querySelector(`#quiz-error-${index}`)
    error.hidden = !invalid
    form.querySelectorAll(`input[name="q${index}"]`).forEach((radio) => {
      if (invalid) {
        radio.setAttribute("aria-invalid", "true")
        radio.setAttribute("aria-describedby", error.id)
      } else {
        radio.removeAttribute("aria-invalid")
        radio.removeAttribute("aria-describedby")
      }
    })
  }

  questions.forEach((_, index) => {
    form.querySelectorAll(`input[name="q${index}"]`).forEach((radio) => {
      radio.addEventListener("change", () => {
        ui.answers[index] = Number(radio.value)
        markQuestion(index, false)
      })
    })
  })

  form.addEventListener("submit", (event) => {
    event.preventDefault()

    const selectedAnswers = questions.map((_, index) => {
      const selected = form.querySelector(`input[name="q${index}"]:checked`)
      return selected ? Number(selected.value) : -1
    })

    ui.answers = selectedAnswers
    const { details, score, total, passed, unanswered } = evaluateQuizSubmission(
      questions,
      selectedAnswers,
      passScore,
    )

    if (unanswered) {
      selectedAnswers.forEach((answer, index) => markQuestion(index, answer < 0))
      const firstMissing = selectedAnswers.findIndex((answer) => answer < 0)
      form.querySelector(`input[name="q${firstMissing}"]`).focus()
      return
    }

    submitQuizAttempt(step.id, { details, score, total, passed })

    ui.result = { score, total, passed, passScore, next,
      details: details.map(({ index, selected, correct }) => ({ index, selected, correct })) }
    form.hidden = true
    results.hidden = false
    results.innerHTML = resultHtml(ui, lesson)

    results.querySelector("#quiz-result-heading").focus()

    if (!passed) {
      results.querySelector("#retry-quiz")?.addEventListener("click", () => {
        ui.answers = []
        ui.missing = []
        ui.result = null
        rerender?.()
        // The shell replaces root during rerender; locate the new form.
        document.querySelector('#quiz-form input[type="radio"]')?.focus()
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
      <p class="eyebrow">${t("lesson.eyebrowEmpty")}</p>
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
