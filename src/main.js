import "./style.css"
import { initRouter } from "./router.js"
import { loadState } from "./store.js"
import { renderLanding } from "./views/landing.js"
import { bindGoal, renderGoal } from "./views/goal.js"
import { bindRoadmap, renderRoadmap } from "./views/roadmap.js"
import { renderDashboard } from "./views/dashboard.js"
import { bindLesson, renderLesson } from "./views/lesson.js"

const app = document.querySelector("#app")
loadState()
let pendingScrollId = null
let currentParts = []

function shell(content) {
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
        <nav aria-label="Navigation principale">
          <a href="#/">Accueil</a>
          <a href="#/goal">Objectif</a>
          <a href="#/roadmap">Itinéraire</a>
          <a href="#/dashboard">Dashboard</a>
          <a href="#/lesson">Leçon</a>
        </nav>
      </header>
      <main class="main">${content}</main>
      <footer class="footer">
        <p><strong>Learnova</strong> — GPS des compétences · prototype hackathon</p>
        <p>Apprentissage intelligent, orienté objectifs.</p>
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
