import { getCurrentStep, getState, hasPath, labelStatus } from "../store.js"

function placeholder({ eyebrow, title, note, backHref = "#/", actionLabel = "Retour à l'accueil" }) {
  return `
    <section class="panel panel--center placeholder">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p class="muted">${note}</p>
      <a class="btn btn--primary" href="${backHref}">${actionLabel}</a>
    </section>
  `
}

export function renderPathPlaceholder() {
  return placeholder({
    eyebrow: "Prochaine étape",
    title: "Construction du parcours",
    note: "Votre objectif est enregistré. La génération du GPS pédagogique arrivera à l'étape suivante.",
    backHref: "#/goal",
    actionLabel: "Retour à l'objectif",
  })
}

export function renderLessonPlaceholder() {
  const current = getCurrentStep()

  if (!hasPath() || !current) {
    return placeholder({
      eyebrow: "Module",
      title: "Leçon",
      note: "Commencez par construire votre itinéraire depuis le tableau de bord.",
      backHref: "#/dashboard",
      actionLabel: "Retour au dashboard",
    })
  }

  return `
    <section class="panel">
      <p class="eyebrow">Module d'apprentissage</p>
      <h1>${escapeHtml(current.title)}</h1>
      <p class="muted">Le contenu complet de la leçon et le quiz arriveront à l'étape suivante du hackathon.</p>
      <p>${escapeHtml(current.description)}</p>
      <p class="step-meta">
        Compétence : ${escapeHtml(current.skill || "À valider")}
        · ${escapeHtml(current.level)}
        · ${escapeHtml(current.duration)}
        · ${escapeHtml(labelStatus(current.status))}
      </p>
      <div class="actions">
        <a class="btn btn--primary" href="#/dashboard">Retour au dashboard</a>
      </div>
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
