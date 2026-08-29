const STORAGE_KEY = "learnova-learner"

const emptyState = () => ({
  goal: "",
  level: "debutant",
  hoursPerWeek: 5,
  analyzed: false,
  intent: "professionnel",
  pathId: "",
  pathTitle: "",
  steps: [],
  skills: [],
  updatedAt: null,
})

let state = emptyState()
const listeners = new Set()

function notify() {
  for (const listener of listeners) {
    listener(state)
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      state = emptyState()
      return state
    }
    const parsed = JSON.parse(raw)
    state = { ...emptyState(), ...parsed }
    if (!Array.isArray(state.steps)) {
      state.steps = []
    }
    if (!Array.isArray(state.skills)) {
      state.skills = []
    }
    state.analyzed = Boolean(state.analyzed)
    state.hoursPerWeek = Number(state.hoursPerWeek) || 5
  } catch {
    state = emptyState()
  }
  return state
}

export function saveState() {
  state.updatedAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  notify()
}

export function getState() {
  return state
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function hasPath() {
  return Array.isArray(state.steps) && state.steps.length > 0
}

export function setProfile({ goal, level, hoursPerWeek, intent }) {
  state.goal = goal
  state.level = level
  state.hoursPerWeek = hoursPerWeek
  if (intent) {
    state.intent = intent
  }
  state.analyzed = false
  state.pathId = ""
  state.pathTitle = ""
  state.steps = []
  state.skills = []
  saveState()
}

export function setAnalyzed(value) {
  state.analyzed = Boolean(value)
  saveState()
}

export function setPath({ pathId, pathTitle, steps }) {
  state.pathId = pathId
  state.pathTitle = pathTitle
  state.steps = steps.map((step, index) => ({
    ...step,
    status: index === 0 ? "current" : "todo",
  }))
  state.skills = []
  saveState()
}

export function getProgressPercent() {
  if (!state.steps.length) {
    return 0
  }
  const done = state.steps.filter((step) => step.status === "done").length
  return Math.round((done / state.steps.length) * 100)
}

export function getCurrentStep() {
  return (
    state.steps.find((step) => step.status === "current") ||
    state.steps.find((step) => step.status === "todo") ||
    state.steps[state.steps.length - 1] ||
    null
  )
}

export function getNextStep() {
  const currentIndex = state.steps.findIndex((step) => step.status === "current")
  if (currentIndex >= 0 && currentIndex < state.steps.length - 1) {
    return state.steps[currentIndex + 1]
  }
  return state.steps.find((step) => step.status === "todo") || null
}

export function getCompletedCompetenciesCount() {
  return state.steps.filter((step) => step.status === "done").length
}

export function getStepById(id) {
  return state.steps.find((step) => step.id === id) || null
}

export function completeStep(stepId) {
  const index = state.steps.findIndex((step) => step.id === stepId)
  if (index === -1) {
    return
  }

  const step = state.steps[index]
  step.status = "done"
  if (step.skill && !state.skills.includes(step.skill)) {
    state.skills.push(step.skill)
  }

  const next = state.steps[index + 1]
  if (next && next.status === "todo") {
    next.status = "current"
  }

  saveState()
}

export function resetLearner() {
  state = emptyState()
  localStorage.removeItem(STORAGE_KEY)
  notify()
}

export function labelHours(hours) {
  const map = {
    2: "2 h / semaine",
    5: "5 h / semaine",
    10: "10 h+ / semaine",
  }
  return map[Number(hours)] || `${hours} h / semaine`
}

export function labelLevel(level) {
  const map = {
    debutant: "Débutant",
    intermediaire: "Intermédiaire",
    avance: "Avancé",
  }
  return map[level] || level
}

export function labelIntent(intent) {
  const map = {
    professionnel: "Professionnel",
    personnel: "Personnel",
    academique: "Académique",
  }
  return map[intent] || intent
}

export function labelStatus(status) {
  const map = {
    todo: "À venir",
    current: "En cours",
    done: "Terminé",
  }
  return map[status] || status
}
