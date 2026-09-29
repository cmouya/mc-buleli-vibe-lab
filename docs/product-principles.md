# Principes produit — Learnova

Ces principes sont **non négociables**. Ils guident les décisions produit, UX, domaine et architecture.

Catégorie produit : **Learning Intelligence System (LIS)**. Le [positionnement canonique](product-positioning.md) complète ces principes. Les implications ci-dessous sont des exigences produit/architecture, pas un inventaire de fonctionnalités livrées : distinguer **CURRENT**, **ACCEPTED / FROZEN**, **TARGET** et **EXPLORATORY / DEFERRED** selon son [registre de capacités](product-positioning.md#current-capability-ledger).

---

## 1. Goal before Content

### Signification

L’apprenant commence par exprimer **où il veut aller**. Le contenu n’est proposé qu’en tant qu’étape justifiée vers cette destination.

### Implication produit

- Le premier écran d’engagement est l’**objectif**, pas un catalogue.
- Chaque activité affiche son lien avec l’objectif et l’étape du parcours.
- Pas de « bibliothèque de cours » comme point d’entrée principal.

### Implication technique

- Le modèle `Goal` est l’agrégat racine du parcours apprenant.
- Les APIs et stores organisent les données autour de `goalId` / session apprenant.
- La génération de parcours consomme l’objectif en entrée obligatoire.

---

## 2. Skills before Courses

### Signification

Les **compétences** structurent le parcours. Les « cours » ou activités sont des véhicules au service des compétences — pas l’inverse.

### Implication produit

- Le GPS affiche des **étapes liées à une ou plusieurs compétences**, pas des modules génériques.
- Le dashboard parle de compétences acquises / en cours, pas de cours complétés.
- La validation d’étape (Completion) n’équivaut pas à la maîtrise de toutes les compétences couvertes (Progress ≠ Mastery ; une Step peut couvrir **une ou plusieurs** Skills).

### Implication technique

- Entités `Skill` et couverture Step↔Skill **many-to-many** (ADR-020 S-10). Le label Golden Reference `PathStep.skill` n’est pas l’identité Skill serveur.
- Évolution vers un **Skill Graph** (prérequis, relations).
- Contenu indexé par compétence, pas seulement par cours.

---

## 3. Evidence before Completion

### Signification

Une étape ou compétence n’est **pas validée** sans **preuve d’apprentissage** observable (quiz, production, critères métier).

### Implication produit

- Pas de bouton « marquer comme terminé » sans assessment.
- Feedback explicite en cas d’échec ; retry et remédiation possibles.
- Historique des preuves consultable (vision future).

### Implication technique

- Entité `Evidence` liée à `Assessment` et `PathStep`.
- `completeStep()` ne s’exécute qu’après validation domaine (seuil, règles).
- Séparation claire entre « activité vue » et « compétence validée ».

---

## 4. Progress is not Mastery

### Signification

**Progression** = avancement sur l’itinéraire (étapes parcourues, % du path).  
**Maîtrise** = niveau réel de compétence, fondé sur preuves et critères.

Un apprenant peut être à 80 % de progression avec une maîtrise faible sur une compétence clé.

### Implication produit

- Afficher progression et maîtrise séparément (dashboard, profil).
- Ne pas équivaloir « quiz réussi une fois » à « expert ».
- Permettre re-évaluation et consolidation (vision future).

### Implication technique

- Types distincts : `ProgressMetrics` vs `Mastery` / `CompetencyState`.
- Pas de déduction mastery depuis `steps.filter(done).length` seul à terme.
- Analytics module traite les deux dimensions séparément.

---

## 5. AI assists but Domain Rules decide

### Signification

L’IA propose, analyse, génère, tutorise — mais les **règles métier** (seuils quiz, ordre des étapes, politiques de validation, contraintes réglementaires) ont le **dernier mot**.

### Implication produit

- Seuils de validation configurables et visibles.
- Étapes verrouillées tant que la précédente n’est pas validée (règle domaine).
- Pas de validation automatique « parce que l’IA l’a dit ».

### Implication technique

- Couche `ai/validators/` + règles dans modules domaine (`assessment`, `learning-path`).
- `MockAIService` / futurs providers ne appellent pas `completeStep()` directement — passent par validators.
- Domain events auditables.

---

## 6. AI decisions must be explainable

### Signification

Toute décision IA significative (parcours proposé, étape suggérée, feedback, adaptation) doit être **compréhensible** par l’apprenant et **justifiable** techniquement.

### Implication produit

- Afficher *pourquoi* ce parcours / cette étape (résumé, facteurs).
- Explications post-quiz (déjà amorcé dans Prototype 0).
- Badge « mode démonstration » tant que l’IA est simulée.

### Implication technique

- Réponses IA structurées : `{ decision, rationale, factors[], mode }`.
- Prompts et templates versionnés dans `ai/prompts/`.
- Logs des inputs/outputs pour audit (backend futur).
- Pas de boîte noire opaque pour la génération de parcours à terme.

---

## Synthèse

| Principe | Anti-pattern à éviter |
|----------|----------------------|
| Goal before Content | Catalogue-first onboarding |
| Skills before Courses | Parcours = liste de MOOCs |
| Evidence before Completion | Checkbox « terminé » |
| Progress ≠ Mastery | 100 % = expert |
| AI assists, Rules decide | Validation 100 % IA |
| AI explainable | Parcours sans justification |

## Guidance pour les contributions

- Traiter Learnova comme un LIS ; préserver Goal before Content et Skills before Courses dans toute fonction de contenu/catalogue.
- Viser la complémentarité avec les LMS existants ; placer les futures intégrations entreprise derrière des interfaces et adapters explicites.
- Construire Skills Intelligence sur les ADR existantes. Ne jamais assimiler inférence, estimation, attribution, complétion ou progression à une maîtrise vérifiée.
- Appliquer l’AI Governance : le domaine conserve l’autorité de validation, scoring, ownership et autorisation. La revue humaine future ne crée pas une seconde autorité de maîtrise.
- Distinguer systématiquement capacité actuelle, architecture acceptée, cible et possibilité différée. Les exigences de provenance IA, d’audit, de politiques tenant et de protection des données ne sont pas toutes implémentées.
- Garder la contextualisation africaine configurable dans un LIS global ; aucune géographie obligatoire ni équivalence entre origine géographique et qualité d’une compétence.

Règles détaillées et sujets d’ADR futurs : [Product Positioning](product-positioning.md). Les ADR Accepted/Frozen conservent leur autorité.
