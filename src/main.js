import './style.css'
import {
  charger,
  lister,
  ajouter,
  basculer,
  supprimer,
  compterRestantes,
} from './app.js'

const formulaire = document.querySelector('#formulaire')
const champTitre = document.querySelector('#titre')
const liste = document.querySelector('#liste')
const vide = document.querySelector('#vide')
const compteur = document.querySelector('#compteur')

function libelleCompteur(restantes) {
  if (restantes === 0) {
    return 'Aucune tâche restante'
  }
  if (restantes === 1) {
    return '1 tâche restante'
  }
  return `${restantes} tâches restantes`
}

function rendre() {
  const taches = lister()
  compteur.textContent = libelleCompteur(compterRestantes())
  vide.hidden = taches.length > 0

  liste.replaceChildren()

  for (const tache of taches) {
    const item = document.createElement('li')
    item.className = tache.terminee ? 'tache tache--faite' : 'tache'

    const caseACocher = document.createElement('input')
    caseACocher.type = 'checkbox'
    caseACocher.checked = tache.terminee
    caseACocher.setAttribute('aria-label', `Marquer « ${tache.titre} » comme terminée`)
    caseACocher.addEventListener('change', () => {
      basculer(tache.id)
      rendre()
    })

    const titre = document.createElement('span')
    titre.className = 'tache__titre'
    titre.textContent = tache.titre

    const boutonSupprimer = document.createElement('button')
    boutonSupprimer.type = 'button'
    boutonSupprimer.className = 'tache__supprimer'
    boutonSupprimer.textContent = 'Supprimer'
    boutonSupprimer.addEventListener('click', () => {
      supprimer(tache.id)
      rendre()
    })

    item.append(caseACocher, titre, boutonSupprimer)
    liste.append(item)
  }
}

formulaire.addEventListener('submit', (event) => {
  event.preventDefault()
  const ok = ajouter(champTitre.value)
  if (!ok) {
    return
  }
  champTitre.value = ''
  champTitre.focus()
  rendre()
})

charger()
rendre()
