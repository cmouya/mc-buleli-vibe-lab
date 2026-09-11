import { t } from "../i18n/index.js"
import { getPathGenerator } from "../adapters/ai/path-generator.js"
import { generateLearningPath } from "../application/index.js"
import { navigate } from "../router.js"
import { getCurrentStep, getProgressPercent, getState, hasPath, setPath } from "../store.js"

let generating = false

export function renderRoadmap() {
  const state = getState()

  if (!state.goal) {
    return `
      <section class="panel panel--center">
        <p class="eyebrow">${t("roadmap.missingEyebrow")}</p>
        <h1>${t("roadmap.missingTitle")}</h1>
        <p class="muted">${t("roadmap.missingLead")}</p>
        <a class="btn btn--primary" href="#/goal">${t("roadmap.missingCta")}</a>
      </section>
    `
  }

  if (!hasPath()) {
    return `
      <section class="panel panel--center">
        <p class="eyebrow">${t("roadmap.buildingEyebrow")}</p>
        <h1>${t("roadmap.buildingTitle")}</h1>
        <p class="muted">${t("roadmap.buildingLead")}</p>
        <div class="spinner" aria-hidden="true"></div>
        <p class="hint">${t("roadmap.buildingHint")}</p>
      </section>
    `
  }

  const percent = getProgressPercent()
  const current = getCurrentStep()
  const allDone = state.steps.every((step) => step.status === "done")
  const nextLabel = allDone
    ? t("roadmap.goalReached")
    : current?.status !== "done"
      ? current.title
      : t("roadmap.finalDestination")
  const finalTitle = allDone ? t("roadmap.goalReached") : t("roadmap.finalDestination")
  const finalBadge = allDone ? t("roadmap.goalReached") : t("roadmap.toReach")
  const finalText = allDone ? t("roadmap.allDoneText") : t("roadmap.notDoneText")

  return `
    <section class="panel roadmap-hero">
      <h1>${t("roadmap.destinationTitle")}</h1>
      <p class="destination">${escapeHtml(state.goal)}</p>
      <h2 class="section-title">${t("roadmap.gpsTitle")}</h2>
      <p class="gps-count">${t("roadmap.stepsCount", { count: state.steps.length })}</p>
      <p class="muted">
        ${t("roadmap.gpsLead")}
      </p>
      <div class="dash-grid">
        <article>
          <p class="meta-label">${t("roadmap.metaStartLevel")}</p>
          <p>${t(`levels.${state.level}`)}</p>
        </article>
        <article>
          <p class="meta-label">${t("roadmap.metaPace")}</p>
          <p>${t(`hours.${state.hoursPerWeek}`)}</p>
        </article>
        <article>
          <p class="meta-label">${t("roadmap.metaNext")}</p>
          <p>${escapeHtml(nextLabel)}</p>
        </article>
      </div>
      <div class="progress" aria-label="${t("roadmap.progressAria")}">
        <div class="progress__bar" style="width:${percent}%"></div>
      </div>
      <p class="progress__label">${t("roadmap.progressLabel", { percent })}</p>
    </section>

    <section class="panel gps" aria-label="${t("roadmap.itineraryAria")}" data-testid="roadmap-ready">
      <h2>${t("roadmap.itineraryTitle")}</h2>
      <p class="muted">${t("roadmap.itineraryMeta", { title: escapeHtml(state.pathTitle), count: state.steps.length })}</p>
      <ol class="roadmap">
        ${state.steps
          .map(
            (step, index) => `
          <li class="roadmap__item roadmap__item--${step.status}">
            <div class="roadmap__node" aria-hidden="true">${index + 1}</div>
            <article>
              <header>
                <h3>${t("roadmap.stepHeading", { n: index + 1, title: escapeHtml(step.title) })}</h3>
                <span class="badge badge--${step.status}">${t(`status.${step.status}`)}</span>
              </header>
              <p>${escapeHtml(step.description)}</p>
              <p class="step-meta">
                ${t("roadmap.skillLine", {
                  skill: escapeHtml(step.skill || t("roadmap.skillFallback")),
                  level: escapeHtml(step.level),
                  duration: escapeHtml(step.duration),
                })}
              </p>
            </article>
          </li>`,
          )
          .join("")}
        <li class="roadmap__item roadmap__item--arrive${allDone ? " roadmap__item--done" : ""}">
          <div class="roadmap__node roadmap__node--flag" aria-hidden="true">★</div>
          <article>
            <header>
              <h3>${finalTitle}</h3>
              <span class="badge${allDone ? " badge--done" : ""}">${finalBadge}</span>
            </header>
            <p>${finalText}</p>
          </article>
        </li>
      </ol>
      <div class="actions">
        <a class="btn btn--primary" href="#/dashboard">${t("roadmap.ctaStart")}</a>
        <a class="btn btn--ghost" href="#/goal">${t("roadmap.ctaReview")}</a>
      </div>
    </section>
  `
}

export function bindRoadmap(rerender) {
  const state = getState()
  if (!state.goal) {
    navigate("/goal")
    return
  }
  if (hasPath() || generating) {
    return
  }

  generating = true
  const started = Date.now()
  generateLearningPath(
    {
      goal: state.goal,
      level: state.level,
      hoursPerWeek: state.hoursPerWeek,
      intent: state.intent,
    },
    getPathGenerator(),
  )
    .then(async (result) => {
      const wait = Math.max(0, 1400 - (Date.now() - started))
      await new Promise((resolve) => setTimeout(resolve, wait))
      setPath(result)
    })
    .catch(() => {
      generating = false
    })
    .finally(() => {
      generating = false
      rerender()
    })
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
