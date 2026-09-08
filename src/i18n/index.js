import { translations } from "./translations.js"

export const UI_LANG_KEY = "learnova-ui-lang"
export const DEFAULT_LANG = "fr"

let currentLang = DEFAULT_LANG

function lookup(dict, path) {
  return path.split(".").reduce((acc, part) => {
    if (acc == null) {
      return undefined
    }
    return acc[part]
  }, dict)
}

function interpolate(value, vars) {
  return value.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? String(vars[key]) : `{${key}}`))
}

export function getLanguage() {
  return currentLang
}

export function loadLanguage() {
  try {
    const stored = sessionStorage.getItem(UI_LANG_KEY)
    currentLang = stored === "en" ? "en" : DEFAULT_LANG
  } catch {
    currentLang = DEFAULT_LANG
  }
  applyDocumentLanguage()
  return currentLang
}

export function setLanguage(lang) {
  currentLang = lang === "en" ? "en" : DEFAULT_LANG
  try {
    sessionStorage.setItem(UI_LANG_KEY, currentLang)
  } catch {
    /* ignore quota / private mode */
  }
  applyDocumentLanguage()
  return currentLang
}

function applyDocumentLanguage() {
  if (typeof document === "undefined") {
    return
  }
  document.documentElement.lang = currentLang
  const title = t("meta.title")
  if (title) {
    document.title = title
  }
}

export function t(path, vars = {}) {
  const primary = lookup(translations[currentLang], path)
  const fallback = lookup(translations[DEFAULT_LANG], path)
  const value = primary !== undefined ? primary : fallback
  if (typeof value !== "string") {
    return path
  }
  return interpolate(value, vars)
}

export function tList(path) {
  const primary = lookup(translations[currentLang], path)
  if (Array.isArray(primary)) {
    return primary
  }
  const fallback = lookup(translations[DEFAULT_LANG], path)
  return Array.isArray(fallback) ? fallback : []
}
