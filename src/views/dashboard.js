import {
  getCompletedCompetenciesCount,
  getCurrentStep,
  getNextStep,
  getProgressPercent,
  getState,
  hasPath,
  labelHours,
  labelLevel,
  labelStatus,
} from "../store.js"

export function renderDashboard() {
  const state = getState()

  if (!state.goal) {
    return emptyPanel(
      "Commencez par votre destination",
      "Exprimez un objectif pour ouvrir votre console de navigation.",
      "#/goal",
      "Exprimer mon objectif",
    )
  }

  if (!hasPath()) {
    return emptyPanel(
      "Itinéraire en attente",
      "Construisez d'abord votre GPS des compétences à partir de votre objectif.",
      "#/roadmap",
      "Voir mon itinéraire",
    )
  }

  const current = getCurrentStep()
  const next = getNextStep()
  const percent = getProgressPercent()
  const completed = getCompletedCompetenciesCount()
  const total = state.steps.length

  if (!current) {
    return emptyPanel(
      "Parcours terminé",
      "Vous avez atteint votre destination. Félicitations !",
      "#/roadmap",
      "Revoir l'itinéraire",
    )
  }

  return `
    <section class="panel dash-hero">
      <p class="eyebrow">Console apprenant</p>
      <h1>Où en suis-je sur mon chemin ?</h1>
      <p class="muted">Votre tableau de bord n'est pas un catalogue — c'est votre position sur l'itinéraire.</p>
    </section>

    <section class="panel">
      <h2>Ma destination</h2>
      <p class="destination destination--compact">${escapeHtml(state.goal)}</p>
      <p class="step-meta">${labelLevel(state.level)} · ${labelHours(state.hoursPerWeek)}</p>
    </section>

    <section class="panel">
      <h2>Ma progression</h2>
      <div class="progress" aria-label="Progression">
        <div class="progress__bar" style="width:${percent}%"></div>
      </div>
      <p class="progress__label" data-testid="progress-label">Progression : ${percent} %</p>
      <p class="dash-stat">
        <strong>${completed}</strong> compétence${completed > 1 ? "s" : ""} acquise${completed > 1 ? "s" : ""}
        sur <strong>${total}</strong>
      </p>
    </section>

    <section class="panel dash-here">
      <h2>Vous êtes ici</h2>
      <article class="dash-step dash-step--current">
        <header>
          <h3>${escapeHtml(current.title)}</h3>
          <span class="badge badge--current">${labelStatus(current.status)}</span>
        </header>
        <p>${escapeHtml(current.description)}</p>
        <p class="step-meta">
          Compétence : ${escapeHtml(current.skill || "À valider")}
          · ${escapeHtml(current.level)}
          · ${escapeHtml(current.duration)}
        </p>
      </article>
    </section>

    <section class="panel">
      <h2>Prochaine étape</h2>
      ${
        next
          ? `
        <article class="dash-step">
          <h3>${escapeHtml(next.title)}</h3>
          <p>${escapeHtml(next.description)}</p>
          <p class="step-meta">${escapeHtml(next.level)} · ${escapeHtml(next.duration)}</p>
        </article>`
          : `<p class="muted">Aucune étape suivante — vous approchez de votre destination finale.</p>`
      }
    </section>

    <section class="panel">
      <h2>Votre itinéraire</h2>
      <ol class="dash-track" aria-label="Progression sur l'itinéraire">
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
        <a class="btn btn--primary" href="#/lesson">Continuer mon parcours</a>
        <a class="btn btn--ghost" href="#/roadmap">Voir le GPS complet</a>
      </div>
    </section>
  `
}

function emptyPanel(title, note, href, label) {
  return `
    <section class="panel panel--center">
      <p class="eyebrow">Tableau de bord</p>
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
