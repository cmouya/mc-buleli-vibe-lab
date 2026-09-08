import { t } from "../i18n/index.js"

export function renderLanding() {
  return `
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero__brand">
        <span class="logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="32" height="32">
            <circle cx="16" cy="16" r="14" fill="#4f46e5"/>
            <path d="M10 18.5 14.2 22 22 11" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span>Learnova</span>
      </div>
      <p class="eyebrow">${t("landing.eyebrow")}</p>
      <h1 id="hero-title">${t("landing.title")}</h1>
      <p class="lead lead--quote">
        ${t("landing.quote")}
      </p>
      <p class="hero__value">
        ${t("landing.value")}
      </p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#/goal">${t("landing.ctaBuild")}</a>
        <a class="btn btn--ghost" href="#/" data-discover>${t("landing.ctaDiscover")}</a>
      </div>
    </section>

    <section class="chain" id="concept" aria-label="${t("landing.chainAria")}">
      <h2 class="section-title">${t("landing.chainTitle")}</h2>
      <div class="chain__row">
        <article>
          <span>1</span>
          <h3>${t("landing.step1Title")}</h3>
          <p>${t("landing.step1Body")}</p>
        </article>
        <div class="chain__arrow" aria-hidden="true">→</div>
        <article>
          <span>2</span>
          <h3>${t("landing.step2Title")}</h3>
          <p>${t("landing.step2Body")}</p>
        </article>
        <div class="chain__arrow" aria-hidden="true">→</div>
        <article>
          <span>3</span>
          <h3>${t("landing.step3Title")}</h3>
          <p>${t("landing.step3Body")}</p>
        </article>
      </div>
    </section>

    <section class="compare" id="avant-apres">
      <h2>${t("landing.compareTitle")}</h2>
      <p class="muted">${t("landing.compareLead")}</p>
      <div class="compare__pair">
        <article class="compare__card compare__card--old">
          <p class="compare__label">${t("landing.lmsLabel")}</p>
          <h3>${t("landing.lmsTitle")}</h3>
          <p>${t("landing.lmsBody")}</p>
        </article>
        <article class="compare__card compare__card--accent">
          <p class="compare__label">${t("landing.learnovaLabel")}</p>
          <h3>${t("landing.learnovaTitle")}</h3>
          <p>${t("landing.learnovaBody")}</p>
        </article>
      </div>
    </section>
  `
}
