import {
  getState,
  labelHours,
  labelLevel,
  setAnalyzed,
  setProfile,
} from "../store.js"

const EXAMPLES = [
  "Je veux apprendre à utiliser l'IA pour développer mon activité.",
  "Je veux devenir Data Analyst.",
  "Je veux améliorer mon anglais professionnel.",
]

export function renderGoal() {
  const state = getState()
  if (state.analyzed && state.goal) {
    return renderConfirmation(state)
  }
  return renderForm(state)
}

function renderForm(state) {
  const hours = String(state.hoursPerWeek === 10 ? 10 : state.hoursPerWeek === 2 ? 2 : 5)

  return `
    <section class="panel goal">
      <p class="eyebrow">Votre destination</p>
      <h1>Quel objectif souhaitez-vous atteindre ?</h1>
      <p class="muted">Pas de catalogue. Décrivez où vous voulez aller — Learnova s'occupera de l'itinéraire.</p>

      <form id="goal-form" class="form goal__form" data-testid="goal-form">
        <label class="sr-only" for="goal">Objectif</label>
        <textarea id="goal" name="goal" rows="4" maxlength="280" required placeholder="Exprimez votre objectif en une ou deux phrases…">${escapeHtml(state.goal)}</textarea>

        <p class="chips-label">Exemples</p>
        <div class="chips" id="examples">
          ${EXAMPLES.map(
            (example) =>
              `<button type="button" class="chip" data-example="${escapeAttr(example)}">${escapeHtml(example)}</button>`,
          ).join("")}
        </div>

        <fieldset class="choices">
          <legend>Niveau actuel</legend>
          <div class="choices__row">
            ${choice("level", "debutant", "Débutant", state.level === "debutant")}
            ${choice("level", "intermediaire", "Intermédiaire", state.level === "intermediaire")}
            ${choice("level", "avance", "Avancé", state.level === "avance")}
          </div>
        </fieldset>

        <fieldset class="choices">
          <legend>Temps disponible</legend>
          <div class="choices__row">
            ${choice("hours", "2", "2 h / semaine", hours === "2")}
            ${choice("hours", "5", "5 h / semaine", hours === "5")}
            ${choice("hours", "10", "10 h+ / semaine", hours === "10")}
          </div>
        </fieldset>

        <p id="form-error" class="error" hidden>Indiquez un objectif avant de continuer.</p>
        <button class="btn btn--primary" type="submit">Analyser mon objectif</button>
      </form>
    </section>
  `
}

function renderAnalyzing() {
  return `
    <section class="panel panel--center goal-wait">
      <p class="eyebrow">Learnova</p>
      <h1>Analyse en cours…</h1>
      <p class="muted">Nous clarifions votre objectif, votre niveau et votre rythme.</p>
      <div class="spinner" aria-hidden="true"></div>
    </section>
  `
}

function renderConfirmation(state) {
  return `
    <section class="panel goal-confirm" data-testid="goal-confirmation">
      <p class="eyebrow">Objectif compris</p>
      <h1>Voici ce que Learnova a retenu</h1>
      <div class="meta-grid meta-grid--confirm">
        <article>
          <p class="meta-label">Objectif</p>
          <p>${escapeHtml(state.goal)}</p>
        </article>
        <article>
          <p class="meta-label">Niveau</p>
          <p>${labelLevel(state.level)}</p>
        </article>
        <article>
          <p class="meta-label">Temps disponible</p>
          <p>${labelHours(state.hoursPerWeek)}</p>
        </article>
      </div>
      <div class="actions">
        <a class="btn btn--primary" href="#/roadmap">Construire mon parcours</a>
        <button type="button" class="btn btn--ghost" id="edit-goal">Modifier l'objectif</button>
      </div>
    </section>
  `
}

function choice(name, value, label, checked) {
  return `
    <label class="choice">
      <input type="radio" name="${name}" value="${value}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `
}

export function bindGoal(root, rerender) {
  const form = root.querySelector("#goal-form")
  if (form) {
    const goal = form.querySelector("#goal")
    const error = root.querySelector("#form-error")

    root.querySelector("#examples")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-example]")
      if (!button) {
        return
      }
      goal.value = button.dataset.example
      goal.focus()
    })

    form.addEventListener("submit", (event) => {
      event.preventDefault()
      const text = goal.value.trim()
      if (!text) {
        error.hidden = false
        goal.focus()
        return
      }
      error.hidden = true
      const data = new FormData(form)
      setProfile({
        goal: text,
        level: String(data.get("level") || "debutant"),
        hoursPerWeek: Number(data.get("hours") || 5),
      })
      root.innerHTML = renderAnalyzing()
      window.setTimeout(() => {
        setAnalyzed(true)
        rerender()
      }, 1600)
    })
    return
  }

  root.querySelector("#edit-goal")?.addEventListener("click", () => {
    setAnalyzed(false)
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

function escapeAttr(value) {
  return escapeHtml(value)
}
