import {
  getCurrentStep,
  getState,
  hasPath,
  labelIntent,
  labelLevel,
  labelStatus,
} from "../store.js"

export function renderPath() {
  if (!hasPath()) {
    return empty("Aucun parcours pour l'instant.", "#/objectif", "Exprimer un objectif")
  }

  const state = getState()
  const current = getCurrentStep()
  const cta = current
    ? `<a class="btn btn--primary" href="#/lecon/${current.id}">${current.status === "done" ? "Revoir l'étape" : "Commencer l'apprentissage"}</a>`
    : ""

  return `
    <section class="panel">
      <p class="eyebrow">GPS pédagogique</p>
      <h1>Votre parcours recommandé</h1>
      <div class="meta-grid">
        <article>
          <p class="meta-label">Votre objectif</p>
          <p>${escapeHtml(state.goal)}</p>
        </article>
        <article>
          <p class="meta-label">Niveau de départ</p>
          <p>${labelLevel(state.level)} · ${labelIntent(state.intent)} · ${state.hoursPerWeek} h / semaine</p>
        </article>
        <article>
          <p class="meta-label">Itinéraire</p>
          <p>${escapeHtml(state.pathTitle)}</p>
        </article>
      </div>
      <div class="actions">${cta}<a class="btn btn--ghost" href="#/dashboard">Voir le tableau de bord</a></div>
    </section>
    <ol class="roadmap">
      ${state.steps
        .map(
          (step, index) => `
        <li class="roadmap__item roadmap__item--${step.status}">
          <div class="roadmap__node">${index + 1}</div>
          <article>
            <header>
              <h2>${escapeHtml(step.title)}</h2>
              <span class="badge badge--${step.status}">${labelStatus(step.status)}</span>
            </header>
            <p>${escapeHtml(step.description)}</p>
            <p class="step-meta">${escapeHtml(step.level)} · ${escapeHtml(step.duration)}</p>
            ${
              step.status !== "todo"
                ? `<a class="link" href="#/lecon/${step.id}">Ouvrir l'étape</a>`
                : `<span class="muted">Débloquée après l'étape précédente</span>`
            }
          </article>
        </li>`,
        )
        .join("")}
    </ol>
  `
}

function empty(message, href, label) {
  return `
    <section class="panel panel--center">
      <h1>${message}</h1>
      <a class="btn btn--primary" href="${href}">${label}</a>
    </section>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
