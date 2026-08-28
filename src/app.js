const STORAGE_KEY = 'mcbuleli-taches'

let taches = []

function creerId() {
  return crypto.randomUUID()
}

export function charger() {
  try {
    const brut = localStorage.getItem(STORAGE_KEY)
    taches = brut ? JSON.parse(brut) : []
    if (!Array.isArray(taches)) {
      taches = []
    }
  } catch {
    taches = []
  }
  return taches
}

export function sauver() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(taches))
}

export function lister() {
  return taches
}

export function ajouter(titre) {
  const texte = titre.trim()
  if (!texte) {
    return false
  }

  taches.push({
    id: creerId(),
    titre: texte,
    terminee: false,
  })
  sauver()
  return true
}

export function basculer(id) {
  const tache = taches.find((item) => item.id === id)
  if (!tache) {
    return
  }
  tache.terminee = !tache.terminee
  sauver()
}

export function supprimer(id) {
  taches = taches.filter((item) => item.id !== id)
  sauver()
}

export function compterRestantes() {
  return taches.filter((item) => !item.terminee).length
}
