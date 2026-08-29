import { getAIService } from "../ai/index.js"
import { getState, hasPath, setPath } from "../store.js"
import { navigate } from "../router.js"

const STEPS = [
  "Analyse de votre objectif…",
  "Diagnostic du niveau et du rythme…",
  "Construction du GPS pédagogique…",
]

export function renderGenerating() {
  return `
    <section class="panel panel--center">
      <p class="eyebrow">IA Learnova</p>
      <h1>Construction de votre parcours</h1>
      <p class="muted" id="gen-status">${STEPS[0]}</p>
      <div class="spinner" aria-hidden="true"></div>
      <p class="hint">Cette étape simule le moteur IA (mode démonstration).</p>
    </section>
  `
}

export function bindGenerating(root) {
  const status = root.querySelector("#gen-status")
  const state = getState()

  if (!state.goal) {
    navigate("/objectif")
    return
  }

  let i = 0
  const timer = setInterval(() => {
    i = Math.min(i + 1, STEPS.length - 1)
    status.textContent = STEPS[i]
  }, 700)

  const ai = getAIService()
  const started = Date.now()

  ai.generatePath({
    goal: state.goal,
    level: state.level,
    hoursPerWeek: state.hoursPerWeek,
    intent: state.intent,
  })
    .then(async (result) => {
      const wait = Math.max(0, 2200 - (Date.now() - started))
      await new Promise((resolve) => setTimeout(resolve, wait))
      setPath(result)
      clearInterval(timer)
      navigate("/parcours")
    })
    .catch(() => {
      clearInterval(timer)
      status.textContent = hasPath()
        ? "Impossible de régénérer. Retour au parcours existant."
        : "Impossible de générer le parcours. Réessayez depuis l'objectif."
      setTimeout(() => navigate(hasPath() ? "/parcours" : "/objectif"), 1600)
    })
}
