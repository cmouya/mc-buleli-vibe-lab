import "./style.css"
import { getLanguage, loadLanguage, setLanguage, t } from "./i18n/index.js"
import { initRouter } from "./router.js"
import { loadState } from "./store.js"
import { renderLanding } from "./views/landing.js"
import { bindGoal, renderGoal } from "./views/goal.js"
import { bindRoadmap, renderRoadmap } from "./views/roadmap.js"
import { renderDashboard } from "./views/dashboard.js"
import { bindLesson, renderLesson } from "./views/lesson.js"

const app = document.querySelector("#app")
loadState()
loadLanguage()
let pendingScrollId = null
let currentParts = []

function shell(content) {
  const lang = getLanguage()
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
          <a href="#/">${t("nav.home")}</a>
          <a href="#/goal">${t("nav.goal")}</a>
          <a href="#/roadmap">${t("nav.roadmap")}</a>
          <a href="#/dashboard">${t("nav.dashboard")}</a>
          <a href="#/lesson">${t("nav.lesson")}</a>
          <div class="lang-switch" data-testid="lang-switch" role="group" aria-label="${t("meta.langGroup")}">
            <button type="button" data-lang="fr" aria-pressed="${lang === "fr"}">FR</button>
            <span aria-hidden="true">|</span>
            <button type="button" data-lang="en" aria-pressed="${lang === "en"}">EN</button>
          </div>
        </nav>
      </header>
      <main class="main">${content}</main>
      <footer class="footer">
        <p>${t("footer.line1").replace("Learnova", "<strong>Learnova</strong>")}</p>
        <p>${t("footer.line2")}</p>
      </footer>
    </div>
  `
}

function render({ parts }) {
  currentParts = parts
  const key = parts[0] === "path" ? "roadmap" : parts[0] || "home"

  const views = {
    home: renderLanding,
    goal: renderGoal,
    roadmap: renderRoadmap,
    dashboard: renderDashboard,
    lesson: renderLesson,
  }

  const html = (views[key] || views.home)()
  app.innerHTML = shell(html)
  const main = app.querySelector(".main")

  if (key === "goal") {
    bindGoal(main, () => render({ parts: currentParts }))
  }
  if (key === "roadmap") {
    bindRoadmap(() => render({ parts: ["roadmap"] }))
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
    render({ parts: currentParts })
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

  if (pendingScrollId && key === "home") {
    const id = pendingScrollId
    pendingScrollId = null
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }
}

initRouter(render)
