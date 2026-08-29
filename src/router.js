function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/"
  const path = raw.startsWith("/") ? raw : `/${raw}`
  const parts = path.split("/").filter(Boolean)
  return { path, parts }
}

export function navigate(to) {
  const hash = to.startsWith("#") ? to : `#${to.startsWith("/") ? to : `/${to}`}`
  if (window.location.hash === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"))
    return
  }
  window.location.hash = hash
}

export function initRouter(onRoute) {
  const handle = () => {
    const { path, parts } = parseHash()
    onRoute({ path, parts })
  }

  window.addEventListener("hashchange", handle)
  handle()

  return () => window.removeEventListener("hashchange", handle)
}
