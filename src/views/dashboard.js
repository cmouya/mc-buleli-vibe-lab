import { t } from "../i18n/index.js"
import {
  getCompletedCompetenciesCount,
  getCurrentStep,
  getNextStep,
  getProgressPercent,
  getState,
  hasPath,
} from "../store.js"

export function renderDashboard() {
  const state = getState()

  if (!state.goal) {
    return emptyPanel(
      t("dash.emptyGoalTitle"),
      t("dash.emptyGoalNote"),
      "#/goal",
      t("dash.emptyGoalCta"),
    )
  }

  if (!hasPath()) {
    return emptyPanel(
      t("dash.emptyPathTitle"),
      t("dash.emptyPathNote"),
      "#/roadmap",
      t("dash.emptyPathCta"),
    )
  }

  const current = getCurrentStep()
  const next = getNextStep()
  const percent = getProgressPercent()
  const completed = getCompletedCompetenciesCount()
  const total = state.steps.length
  const skillsLabel =
    completed > 1
      ? t("dash.skillsMany", { count: completed, total })
      : t("dash.skillsOne", { count: completed, total })

  if (!current) {
    return emptyPanel(
      t("dash.finishedTitle"),
      t("dash.finishedNote"),
      "#/roadmap",
      t("dash.finishedCta"),
    )
  }

  return `
    <section class="panel dash-hero">
      <p class="eyebrow">${t("dash.eyebrow")}</p>
      <h1>${t("dash.title")}</h1>
      <p class="muted">${t("dash.lead")}</p>
    </section>

    <section class="panel">
      <h2>${t("dash.destination")}</h2>
      <p class="destination destination--compact">${escapeHtml(state.goal)}</p>
      <p class="step-meta">${t(`levels.${state.level}`)} · ${t(`hours.${state.hoursPerWeek}`)}</p>
    </section>

    <section class="panel">
      <h2>${t("dash.progression")}</h2>
      <div class="progress" aria-label="${t("roadmap.progressAria")}">
        <div class="progress__bar" style="width:${percent}%"></div>
      </div>
      <p class="progress__label" data-testid="progress-label">${t("roadmap.progressLabel", { percent })}</p>
      <p class="dash-stat">
        ${skillsLabel}
      </p>
    </section>

    <section class="panel dash-here">
      <h2>${t("dash.youAreHere")}</h2>
      <article class="dash-step dash-step--current">
        <header>
          <h3>${escapeHtml(current.title)}</h3>
          <span class="badge badge--current">${t(`status.${current.status}`)}</span>
        </header>
        <p>${escapeHtml(current.description)}</p>
        <p class="step-meta">
          ${t("dash.skillLine", {
            skill: escapeHtml(current.skill || t("dash.skillFallback")),
            level: escapeHtml(current.level),
            duration: escapeHtml(current.duration),
          })}
        </p>
      </article>
    </section>

    <section class="panel">
      <h2>${t("dash.nextStep")}</h2>
      ${
        next
          ? `
        <article class="dash-step">
          <h3>${escapeHtml(next.title)}</h3>
          <p>${escapeHtml(next.description)}</p>
          <p class="step-meta">${escapeHtml(next.level)} · ${escapeHtml(next.duration)}</p>
        </article>`
          : `<p class="muted">${t("dash.noNext")}</p>`
      }
    </section>

    <section class="panel">
      <h2>${t("dash.itinerary")}</h2>
      <ol class="dash-track" aria-label="${t("dash.itineraryAria")}">
        ${state.steps
          .map(
            (step, index) => `
          <li class="dash-track__item dash-track__item--${step.status}" title="${escapeHtml(step.title)}">
            <span class="dash-track__dot">${index + 1}</span>
            <span class="dash-track__label">${escapeHtml(shortTitle(step.title))}</span>
          </li>`,
          )
          .join("")}
      </ol>
      <div class="actions">
        <a class="btn btn--primary" href="#/lesson">${t("dash.ctaContinue")}</a>
        <a class="btn btn--ghost" href="#/roadmap">${t("dash.ctaGps")}</a>
      </div>
    </section>
  `
}

function emptyPanel(title, note, href, label) {
  return `
    <section class="panel panel--center">
      <p class="eyebrow">${t("dash.eyebrowEmpty")}</p>
      <h1>${title}</h1>
      <p class="muted">${note}</p>
      <a class="btn btn--primary" href="${href}">${label}</a>
    </section>
  `
}

function shortTitle(title) {
  return title.length > 28 ? `${title.slice(0, 25)}…` : title
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
