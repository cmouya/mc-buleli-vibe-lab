import {
  applyConfirmGoal,
  applyCreateProfile,
  applyMarkAnalyzed,
  applyQuizAttempt,
  assertCanCompleteStep,
  assertGoalReadyForPathFromLegacy,
  pathBindPatch,
} from "./adapters/store/index.js"

const STORAGE_KEY = "learnova-learner"

const emptyState = () => ({
  goal: "",
  level: "debutant",
  hoursPerWeek: 5,
  analyzed: false,
  confirmed: false,
  intent: "professionnel",
  pathId: "",
  pathTitle: "",
  steps: [],
  skills: [],
  evidence: [],
  updatedAt: null,
})

let state = emptyState()
const listeners = new Set()

function notify() {
  for (const listener of listeners) {
    listener(state)
  }
}

function legacyGoalFields() {
  return {
    goal: state.goal,
    level: state.level,
    hoursPerWeek: state.hoursPerWeek,
    intent: state.intent,
    analyzed: Boolean(state.analyzed),
    confirmed: Boolean(state.confirmed),
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
    if (!Array.isArray(state.evidence)) {
      state.evidence = []
    }
    state.analyzed = Boolean(state.analyzed)
    state.confirmed = Boolean(state.confirmed)
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
  const patch = applyCreateProfile({
    goal,
    level,
    hoursPerWeek,
    intent,
  })
  state.goal = patch.goal
  state.level = patch.level
  state.hoursPerWeek = patch.hoursPerWeek
  state.intent = patch.intent
  state.analyzed = false
  state.confirmed = false
  state.pathId = patch.pathId ?? ""
  state.pathTitle = patch.pathTitle ?? ""
  state.steps = Array.isArray(patch.steps) ? patch.steps : []
  state.skills = Array.isArray(patch.skills) ? patch.skills : []
  state.evidence = []
  saveState()
}

export function setAnalyzed(value) {
  const patch = applyMarkAnalyzed(legacyGoalFields(), Boolean(value))
  state.analyzed = Boolean(patch.analyzed)
  state.confirmed = Boolean(patch.confirmed)
  saveState()
}

/**
 * Explicit human confirmation (Confirmation CTA). Does not set path.
 */
export function confirmCurrentGoal() {
  const patch = applyConfirmGoal(legacyGoalFields())
  state.confirmed = Boolean(patch.confirmed)
  if (patch.analyzed !== undefined) {
    state.analyzed = Boolean(patch.analyzed)
  }
  saveState()
}

export function setPath({ pathId, pathTitle, steps }) {
  // I-01: assert only — never silently confirm
  assertGoalReadyForPathFromLegacy(legacyGoalFields())

  const bound = pathBindPatch({ pathId, pathTitle })
  state.pathId = bound.pathId
  state.pathTitle = bound.pathTitle
  state.steps = steps.map((step, index) => ({
    ...step,
    status: index === 0 ? "current" : "todo",
  }))
  state.skills = []
  state.evidence = []
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

/**
 * Record a quiz attempt. Failed attempts persist Evidence but do not complete the step (I-05).
 */
export function submitQuizAttempt(stepId, evaluation) {
  const { evidence, completionAllowed } = applyQuizAttempt({
    stepId,
    score: evaluation.score,
    total: evaluation.total,
    passed: evaluation.passed,
    details: evaluation.details,
  })

  if (!Array.isArray(state.evidence)) {
    state.evidence = []
  }
  state.evidence.push(evidence)

  if (completionAllowed) {
    applyStepCompletion(stepId)
  }

  saveState()
  return { evidence, completed: completionAllowed }
}

/**
 * Complete a step. Requires passed Evidence for that step (I-05).
 * Does not append evidence — callers that have a quiz result should use submitQuizAttempt.
 */
export function completeStep(stepId, evidence) {
  assertCanCompleteStep(evidence, stepId)
  applyStepCompletion(stepId)
  saveState()
}

function applyStepCompletion(stepId) {
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
