import { getAIService } from "../ai/index.js"
import { navigate } from "../router.js"
import {
  getCurrentStep,
  getProgressPercent,
  getState,
  hasPath,
  labelHours,
  labelLevel,
  labelStatus,
  setPath,
} from "../store.js"

let generating = false

export function renderRoadmap() {
  const state = getState()

  if (!state.goal) {
    return `
      <section class="panel panel--center">
        <p class="eyebrow">Destination manquante</p>
        <h1>Commencez par votre objectif</h1>
        <p class="muted">Learnova construit un itinéraire à partir d'une destination, pas d'un catalogue.</p>
        <a class="btn btn--primary" href="#/goal">Exprimer mon objectif</a>
      </section>
    `
  }

  if (!hasPath()) {
    return `
      <section class="panel panel--center">
        <p class="eyebrow">GPS des compétences</p>
        <h1>Construction de votre itinéraire…</h1>
        <p class="muted">Learnova relie votre destination à des étapes de compétence.</p>
        <div class="spinner" aria-hidden="true"></div>
        <p class="hint">Moteur local de démonstration — aucun modèle externe n'est appelé.</p>
      </section>
    `
  }

  const percent = getProgressPercent()
  const current = getCurrentStep()
  const allDone = state.steps.every((step) => step.status === "done")
  const nextLabel = allDone
    ? "Objectif atteint"
    : current?.status !== "done"
      ? current.title
      : "Destination finale"
  const finalTitle = allDone ? "Objectif atteint" : "Destination finale"
  const finalBadge = allDone ? "Objectif atteint" : "À atteindre"
  const finalText = allDone
    ? "Vous avez parcouru toutes les étapes de votre itinéraire."
    : "Votre objectif devient réalité une fois toutes les étapes de compétence validées."

  return `
    <section class="panel roadmap-hero">
      <h1>Votre destination</h1>
      <p class="destination">${escapeHtml(state.goal)}</p>
      <h2 class="section-title">Votre GPS des compétences</h2>
      <p class="gps-count">${state.steps.length} étapes personnalisées</p>
      <p class="muted">
        Learnova ne vous demande pas de choisir parmi des centaines de cours.
        À partir de votre objectif, il construit un itinéraire adapté à votre situation.
      </p>
      <div class="dash-grid">
        <article>
          <p class="meta-label">Niveau de départ</p>
          <p>${labelLevel(state.level)}</p>
        </article>
        <article>
          <p class="meta-label">Rythme</p>
          <p>${labelHours(state.hoursPerWeek)}</p>
        </article>
        <article>
          <p class="meta-label">Prochaine étape</p>
          <p>${escapeHtml(nextLabel)}</p>
        </article>
      </div>
      <div class="progress" aria-label="Progression">
        <div class="progress__bar" style="width:${percent}%"></div>
      </div>
      <p class="progress__label">Progression : ${percent} %</p>
    </section>

    <section class="panel gps" aria-label="Itinéraire personnalisé" data-testid="roadmap-ready">
      <h2>Votre itinéraire personnalisé</h2>
      <p class="muted">${escapeHtml(state.pathTitle)} · ${state.steps.length} étapes de compétence</p>
      <ol class="roadmap">
        ${state.steps
          .map(
            (step, index) => `
          <li class="roadmap__item roadmap__item--${step.status}">
            <div class="roadmap__node" aria-hidden="true">${index + 1}</div>
            <article>
              <header>
                <h3>Étape ${index + 1} · ${escapeHtml(step.title)}</h3>
                <span class="badge badge--${step.status}">${labelStatus(step.status)}</span>
              </header>
              <p>${escapeHtml(step.description)}</p>
              <p class="step-meta">
                Compétence : ${escapeHtml(step.skill || "À valider")}
                · ${escapeHtml(step.level)}
                · ${escapeHtml(step.duration)}
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
        <a class="btn btn--primary" href="#/dashboard">Commencer mon parcours</a>
        <a class="btn btn--ghost" href="#/goal">Revoir l'objectif</a>
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
  getAIService()
    .generatePath({
      goal: state.goal,
      level: state.level,
      hoursPerWeek: state.hoursPerWeek,
      intent: state.intent,
    })
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
