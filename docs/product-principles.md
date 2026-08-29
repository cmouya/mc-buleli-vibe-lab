# Principes produit — Learnova

Ces principes sont **non négociables**. Ils guident les décisions produit, UX, domaine et architecture.

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

- Le GPS affiche des **étapes de compétence**, pas des modules génériques.
- Le dashboard parle de compétences acquises / en cours, pas de cours complétés.
- La validation porte sur une compétence cible par étape.

### Implication technique

- Entités `Skill`, `Competency`, `PathStep.skillId` explicites.
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
