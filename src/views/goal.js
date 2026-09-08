import { t, tList } from "../i18n/index.js"
import { confirmCurrentGoal, getState, setAnalyzed, setProfile } from "../store.js"

export function renderGoal() {
  const state = getState()
  if (state.analyzed && state.goal) {
    return renderConfirmation(state)
  }
  return renderForm(state)
}

function renderForm(state) {
  const hours = String(state.hoursPerWeek === 10 ? 10 : state.hoursPerWeek === 2 ? 2 : 5)
  const examples = tList("goal.examples")

  return `
    <section class="panel goal">
      <p class="eyebrow">${t("goal.eyebrow")}</p>
      <h1>${t("goal.title")}</h1>
      <p class="muted">${t("goal.lead")}</p>

      <form id="goal-form" class="form goal__form" data-testid="goal-form">
        <label class="sr-only" for="goal">${t("goal.labelGoal")}</label>
        <textarea id="goal" name="goal" rows="4" maxlength="280" required placeholder="${t("goal.placeholder")}">${escapeHtml(state.goal)}</textarea>

        <p class="chips-label">${t("goal.examplesLabel")}</p>
        <div class="chips" id="examples">
          ${examples
            .map(
              (example) =>
                `<button type="button" class="chip" data-example="${escapeAttr(example)}">${escapeHtml(example)}</button>`,
            )
            .join("")}
        </div>

        <fieldset class="choices">
          <legend>${t("goal.levelLegend")}</legend>
          <div class="choices__row">
            ${choice("level", "debutant", t("levels.debutant"), state.level === "debutant")}
            ${choice("level", "intermediaire", t("levels.intermediaire"), state.level === "intermediaire")}
            ${choice("level", "avance", t("levels.avance"), state.level === "avance")}
          </div>
        </fieldset>

        <fieldset class="choices">
          <legend>${t("goal.hoursLegend")}</legend>
          <div class="choices__row">
            ${choice("hours", "2", t("hours.2"), hours === "2")}
            ${choice("hours", "5", t("hours.5"), hours === "5")}
            ${choice("hours", "10", t("hours.10"), hours === "10")}
          </div>
        </fieldset>

        <p id="form-error" class="error" hidden>${t("goal.formError")}</p>
        <button class="btn btn--primary" type="submit">${t("goal.submit")}</button>
      </form>
    </section>
  `
}

function renderAnalyzing() {
  return `
    <section class="panel panel--center goal-wait">
      <p class="eyebrow">${t("goal.analyzingEyebrow")}</p>
      <h1>${t("goal.analyzingTitle")}</h1>
      <p class="muted">${t("goal.analyzingLead")}</p>
      <div class="spinner" aria-hidden="true"></div>
    </section>
  `
}

function renderConfirmation(state) {
  return `
    <section class="panel goal-confirm" data-testid="goal-confirmation">
      <p class="eyebrow">${t("goal.confirmEyebrow")}</p>
      <h1>${t("goal.confirmTitle")}</h1>
      <div class="meta-grid meta-grid--confirm">
        <article>
          <p class="meta-label">${t("goal.metaGoal")}</p>
          <p>${escapeHtml(state.goal)}</p>
        </article>
        <article>
          <p class="meta-label">${t("goal.metaLevel")}</p>
          <p>${t(`levels.${state.level}`)}</p>
        </article>
        <article>
          <p class="meta-label">${t("goal.metaHours")}</p>
          <p>${t(`hours.${state.hoursPerWeek}`)}</p>
        </article>
      </div>
      <div class="actions">
        <a class="btn btn--primary" href="#/roadmap">${t("goal.ctaBuild")}</a>
        <button type="button" class="btn btn--ghost" id="edit-goal">${t("goal.ctaEdit")}</button>
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

  const confirmCta = root.querySelector(".goal-confirm a.btn--primary[href='#/roadmap']")
  confirmCta?.addEventListener("click", () => {
    confirmCurrentGoal()
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
