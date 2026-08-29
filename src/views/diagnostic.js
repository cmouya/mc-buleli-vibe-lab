import { setProfile } from "../store.js"
import { navigate } from "../router.js"

const EXAMPLES = [
  "Je veux apprendre l'intelligence artificielle.",
  "Je veux devenir data analyst.",
  "Je veux créer mon entreprise.",
  "Je veux améliorer mon anglais professionnel.",
  "Je veux apprendre à utiliser l'IA pour développer mon activité.",
]

export function renderDiagnostic() {
  return `
    <section class="panel">
      <p class="eyebrow">Diagnostic</p>
      <h1>Quel objectif souhaitez-vous atteindre ?</h1>
      <p class="muted">Décrivez votre destination. Learnova construira l'itinéraire.</p>

      <form id="goal-form" class="form">
        <label for="goal">Objectif</label>
        <textarea id="goal" name="goal" rows="3" maxlength="280" required placeholder="Ex. Je veux apprendre à utiliser l'IA pour développer mon activité."></textarea>

        <p class="chips-label">Exemples</p>
        <div class="chips" id="examples">
          ${EXAMPLES.map(
            (example) =>
              `<button type="button" class="chip" data-example="${escapeAttr(example)}">${example}</button>`,
          ).join("")}
        </div>

        <div class="form__row">
          <div>
            <label for="level">Niveau actuel</label>
            <select id="level" name="level">
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </select>
          </div>
          <div>
            <label for="hours">Temps par semaine</label>
            <select id="hours" name="hours">
              <option value="3">3 heures</option>
              <option value="5" selected>5 heures</option>
              <option value="8">8 heures</option>
            </select>
          </div>
          <div>
            <label for="intent">Type d'objectif</label>
            <select id="intent" name="intent">
              <option value="professionnel">Professionnel</option>
              <option value="personnel">Personnel</option>
              <option value="academique">Académique</option>
            </select>
          </div>
        </div>

        <p id="form-error" class="error" hidden>Indiquez un objectif d'au moins quelques mots.</p>
        <button class="btn btn--primary" type="submit">Générer mon parcours</button>
      </form>
    </section>
  `
}

function escapeAttr(value) {
  return value.replaceAll('"', "&quot;")
}

export function bindDiagnostic(root) {
  const form = root.querySelector("#goal-form")
  const goal = root.querySelector("#goal")
  const error = root.querySelector("#form-error")

  root.querySelector("#examples").addEventListener("click", (event) => {
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
    if (text.length < 8) {
      error.hidden = false
      return
    }
    error.hidden = true
    setProfile({
      goal: text,
      level: form.level.value,
      hoursPerWeek: Number(form.hours.value),
      intent: form.intent.value,
    })
    navigate("/generation")
  })
}
