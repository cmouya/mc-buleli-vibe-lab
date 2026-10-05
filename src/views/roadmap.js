import { getLanguage, t } from "../i18n/index.js"
import { resolvePathPresentation } from "../data/outlook-content.js"
import { getPathGenerator } from "../adapters/ai/path-generator.js"
import { generateLearningPath } from "../application/index.js"
import { navigate } from "../router.js"
import { getCurrentStep, getProgressPercent, getState, hasPath, setPath } from "../store.js"

let generation = null

export function cancelRoadmapGeneration() {
  if (generation) window.clearTimeout(generation.timer)
  generation = null
}

function generationMatches(operation) {
  const state = getState()
  return generation === operation && window.location.hash === operation.route && state === operation.state &&
    state.steps === operation.steps && state.confirmed &&
    JSON.stringify([state.goal, state.level, state.hoursPerWeek, state.intent, state.analyzed, state.confirmed]) === operation.snapshot
}

export function renderRoadmap() {
  const state = getState()

  if (generation && !generationMatches(generation)) cancelRoadmapGeneration()
  if (!state.goal || !state.confirmed) {
    return `
      <section class="panel panel--center">
        <p class="eyebrow">${t("roadmap.missingEyebrow")}</p>
        <h1 data-view-heading tabindex="-1">${t("roadmap.missingTitle")}</h1>
        <p class="muted">${t("roadmap.missingLead")}</p>
        <a class="btn btn--primary" href="#/goal">${t("roadmap.missingCta")}</a>
      </section>
    `
  }

  if (!hasPath() && generation?.status === "error") {
    return `
      <section class="panel panel--center" data-testid="roadmap-error">
        <h1 data-view-heading tabindex="-1" aria-describedby="roadmap-error-description">${t("roadmap.errorTitle")}</h1>
        <p id="roadmap-error-description">${t("roadmap.errorLead")}</p>
        <button type="button" class="btn btn--primary" data-retry-roadmap>${t("roadmap.retry")}</button>
      </section>
    `
  }

  if (!hasPath()) {
    return `
      <section class="panel panel--center">
        <p class="eyebrow">${t("roadmap.buildingEyebrow")}</p>
        <h1 data-view-heading tabindex="-1" aria-describedby="roadmap-loading-description">${t("roadmap.buildingTitle")}</h1>
        <p id="roadmap-loading-description" class="muted">${t("roadmap.buildingLead")}</p>
        <div class="spinner" aria-hidden="true"></div>
        <p class="hint">${t("roadmap.buildingHint")}</p>
      </section>
    `
  }

  const percent = getProgressPercent()
  const presentation = resolvePathPresentation(state, getLanguage())
  const current = presentation.steps.find((step) => step.id === getCurrentStep()?.id)
  const allDone = presentation.steps.every((step) => step.status === "done")
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
      <h1 data-view-heading tabindex="-1">${t("roadmap.destinationTitle")}</h1>
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
      <p class="muted">${t("roadmap.itineraryMeta", { title: escapeHtml(presentation.pathTitle), count: presentation.steps.length })}</p>
      <ol class="roadmap">
        ${presentation.steps
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

export function bindRoadmap(root, rerender) {
  const state = getState()
  if (!state.goal || !state.confirmed) {
    cancelRoadmapGeneration()
    navigate("/goal")
    return
  }
  if (generation && !generationMatches(generation)) cancelRoadmapGeneration()
  if (hasPath()) return
  if (generation?.status === "error") {
    root.querySelector("[data-retry-roadmap]")?.addEventListener("click", () => {
      cancelRoadmapGeneration()
      rerender()
    }, { once: true })
    return
  }
  if (generation) return

  const operation = {
    state,
    route: window.location.hash,
    steps: state.steps,
    snapshot: JSON.stringify([state.goal, state.level, state.hoursPerWeek, state.intent, state.analyzed, state.confirmed]),
    status: "pending",
    timer: null,
    started: Date.now(),
  }
  generation = operation
  const input = { goal: state.goal, level: state.level, hoursPerWeek: state.hoursPerWeek, intent: state.intent }
  const fail = () => {
    if (!generationMatches(operation)) return
    operation.status = "error"
    rerender()
  }
  // Catch synchronous adapter failures as well as rejected generation promises.
  Promise.resolve().then(() => {
    if (!generationMatches(operation)) return
    return generateLearningPath(input, getPathGenerator())
  }).then((result) => {
    if (!generationMatches(operation)) return
    operation.timer = window.setTimeout(() => {
      if (!generationMatches(operation)) return
      try {
        setPath(result)
        generation = null
        rerender()
      } catch {
        fail()
      }
    }, Math.max(0, 1400 - (Date.now() - operation.started)))
  }).catch(fail)
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
