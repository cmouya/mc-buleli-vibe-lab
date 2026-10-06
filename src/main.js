import "./style.css"
import { getLanguage, loadLanguage, setLanguage, t } from "./i18n/index.js"
import { resolvePathPresentation } from "./data/outlook-content.js"
import { initRouter } from "./router.js"
import { getCurrentStep, getProgressPercent, getState, hasPath, loadState } from "./store.js"
import { renderLanding } from "./views/landing.js"
import { bindGoal, cancelGoalPreparation, resetGoalDraft, renderGoal } from "./views/goal.js"
import { bindRoadmap, cancelRoadmapGeneration, renderRoadmap } from "./views/roadmap.js"
import { renderDashboard } from "./views/dashboard.js"
import { bindLesson, renderLesson, resetLessonState } from "./views/lesson.js"

const app = document.querySelector("#app")
loadState()
loadLanguage()
let pendingScrollId = null
let currentParts = []
let currentView = null

function shell(content, routeKey) {
  const lang = getLanguage()
  const hasJourney = hasPath()
  const currentStep = getCurrentStep()
  const presentation = hasJourney ? resolvePathPresentation(getState(), lang) : null
  const displayCurrentStep = presentation?.steps.find((step) => step.id === currentStep?.id) || currentStep
  const progress = getProgressPercent()
  const navLink = (key, href, label) => `<a class="nav__link${routeKey === key ? " nav__link--active" : ""}" href="${href}"${routeKey === key ? ' aria-current="page"' : ""}>${label}</a>`
  return `
    <div class="layout">
      <header class="topbar">
        <a class="brand" href="#/">
          <span class="logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <circle cx="16" cy="16" r="14" fill="#4f46e5"/>
              <path d="M10 18.5 14.2 22 22 11" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          Learnova
        </a>
        <nav aria-label="${t("nav.aria")}">
          ${navLink("home", "#/", t("nav.home"))}
          ${navLink("goal", "#/goal", t("nav.goal"))}
          ${navLink("roadmap", "#/roadmap", t("nav.roadmap"))}
          ${navLink("dashboard", "#/dashboard", t("nav.dashboard"))}
          ${navLink("lesson", "#/lesson", t("nav.lesson"))}
          <div class="lang-switch" data-testid="lang-switch" role="group" aria-label="${t("meta.langGroup")}">
            <button type="button" data-lang="fr" aria-pressed="${lang === "fr"}">FR</button>
            <span aria-hidden="true">|</span>
            <button type="button" data-lang="en" aria-pressed="${lang === "en"}">EN</button>
          </div>
        </nav>
        ${hasJourney ? `<div class="journey-status" aria-label="${t("roadmap.progressAria")}">
          <span class="journey-status__value">${progress}%</span>
          <span class="journey-status__copy">${escapeHtml(displayCurrentStep ? displayCurrentStep.title : t("roadmap.goalReached"))}</span>
        </div>` : ""}
      </header>
      <div class="main">
        <p class="panel" data-testid="demo-notice">${t("meta.demoNotice")}</p>
        <main class="main">${content}</main>
      </div>
      <footer class="footer">
        <p>${t("footer.line1").replace("Learnova", "<strong>Learnova</strong>")}</p>
        <p>${t("footer.line2")}</p>
      </footer>
    </div>
  `
}

function render({ parts, languageSwitch = false }) {
  currentParts = parts
  const key = parts[0] === "path" ? "roadmap" : parts[0] || "home"

  if (currentView !== key) {
    if (currentView === "goal") resetGoalDraft()
    if (currentView === "lesson") resetLessonState()
    cancelGoalPreparation()
    cancelRoadmapGeneration()
    currentView = key
  }
  const rerenderActiveView = () => {
    if (currentView === key) render({ parts: currentParts })
  }

  const views = {
    home: renderLanding,
    goal: renderGoal,
    roadmap: renderRoadmap,
    dashboard: renderDashboard,
    lesson: renderLesson,
  }

  const html = (views[key] || views.home)()
  app.innerHTML = shell(html, key)
  const main = app.querySelector("main")

  if (key === "goal") {
    bindGoal(main, rerenderActiveView)
  }
  if (key === "roadmap") {
    bindRoadmap(main, rerenderActiveView)
  }
  if (key === "lesson") {
    bindLesson(main, () => render({ parts: currentParts }))
  }

  app.querySelector("[data-testid='lang-switch']")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang]")
    if (!button) {
      return
    }
    setLanguage(button.dataset.lang)
    event.stopPropagation()
    render({ parts: currentParts, languageSwitch: true })
  })

  const discover = app.querySelector("[data-discover]")
  discover?.addEventListener("click", (event) => {
    event.preventDefault()
    if (key === "home") {
      document.getElementById("concept")?.scrollIntoView({ behavior: "smooth" })
      return
    }
    pendingScrollId = "concept"
    window.location.hash = "#/"
  })

  // Focus only the active Goal/Roadmap view, after bindings may redirect.
  const routePart = window.location.hash.replace(/^#/, "").split("/").filter(Boolean)[0] || "home"
  const routeKey = routePart === "path" ? "roadmap" : routePart
  if ((key === "goal" || key === "roadmap" || (key === "lesson" && languageSwitch)) && routeKey === key && main.isConnected) {
    const target = languageSwitch
      ? app.querySelector(`[data-lang="${getLanguage()}"]`)
      : main.querySelector("[data-view-heading]")
    target?.focus()
  }

  if (pendingScrollId && key === "home") {
    const id = pendingScrollId
    pendingScrollId = null
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }
}

initRouter(render)

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
