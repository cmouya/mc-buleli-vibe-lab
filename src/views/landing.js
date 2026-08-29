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
      <p class="eyebrow">Plateforme d'apprentissage intelligent · GPS des compétences</p>
      <h1 id="hero-title">L'apprentissage intelligent, orienté vers vos objectifs.</h1>
      <p class="lead lead--quote">
        Ne cherchez plus quel cours suivre.<br />
        Dites-nous où vous voulez aller.
      </p>
      <p class="hero__value">
        Learnova n'est pas un catalogue de cours. Vous exprimez un objectif ;
        l'IA construit l'itinéraire de compétences pour y arriver.
      </p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="#/goal">Construire mon parcours</a>
        <a class="btn btn--ghost" href="#/" data-discover>Découvrir Learnova</a>
      </div>
    </section>

    <section class="chain" id="concept" aria-label="Le concept en trois étapes">
      <h2 class="section-title">Objectif → IA → Parcours personnalisé</h2>
      <div class="chain__row">
        <article>
          <span>1</span>
          <h3>Objectif</h3>
          <p>Vous dites où vous voulez aller — métier, étude ou projet personnel.</p>
        </article>
        <div class="chain__arrow" aria-hidden="true">→</div>
        <article>
          <span>2</span>
          <h3>IA</h3>
          <p>Learnova analyse l'objectif et diagnostique le chemin le plus utile.</p>
        </article>
        <div class="chain__arrow" aria-hidden="true">→</div>
        <article>
          <span>3</span>
          <h3>Parcours personnalisé</h3>
          <p>Un GPS pédagogique : étapes, niveau, durée, prochaine action.</p>
        </article>
      </div>
    </section>

    <section class="compare" id="avant-apres">
      <h2>LMS traditionnel vs Learnova</h2>
      <p class="muted">La différence que le jury doit voir en un coup d'œil.</p>
      <div class="compare__pair">
        <article class="compare__card compare__card--old">
          <p class="compare__label">LMS traditionnel</p>
          <h3>Je cherche un cours.</h3>
          <p>Je dois déjà savoir ce dont j'ai besoin. Le catalogue décide pour moi.</p>
        </article>
        <article class="compare__card compare__card--accent">
          <p class="compare__label">Learnova · GPS des compétences</p>
          <h3>Je donne mon objectif.</h3>
          <p>L'IA construit mon parcours. Je commence par la destination, pas par la liste.</p>
        </article>
      </div>
    </section>
  `
}
