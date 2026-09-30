# Vision — Learnova

## Qu’est-ce que Learnova ?

Learnova est un **Learning Intelligence System (LIS)**. Sa vision est d’accompagner un apprenant de son **objectif** jusqu’à la **maîtrise démontrée** de compétences, avec un parcours, des activités et un soutien pédagogique adaptés aux preuves et au contexte.

Cette page décrit la **TARGET** produit. Le [positionnement canonique](product-positioning.md) distingue **CURRENT**, **ACCEPTED / FROZEN**, **TARGET** et **EXPLORATORY / DEFERRED** ; ses références au code local précisent les capacités présentes. Une ambition décrite ici ne vaut pas implémentation.

Learnova n’est pas un LMS traditionnel. Ce n’est pas un catalogue de cours avec un chatbot. C’est un **GPS des compétences** orienté destination.

> Ne cherchez plus quel cours suivre. Dites-nous où vous voulez aller.

## Problème résolu

### Côté apprenant

- L’apprenant sait *où* il veut aller (objectif professionnel, projet, reconversion) mais ne sait pas *par où* commencer.
- Une entrée centrée sur le catalogue suppose qu’il connaît déjà les bons cours, modules et prérequis.
- La progression affichée (cours terminés, vidéos vues) ne prouve pas la **maîtrise** réelle.
- Le parcours est rigide : peu d’adaptation quand l’apprenant échoue, accélère ou change de contexte.

### Côté organisation (vision produit)

- Difficulté à relier formation, compétences métier et résultats mesurables.
- Contenus dispersés, peu personnalisés par objectif réel.
- L’IA est souvent ajoutée en surface (chatbot) sans structurer le parcours ni les preuves d’apprentissage.

Learnova adresse ces gaps en inversant la logique : **l’objectif précède le contenu**, les **compétences** précèdent les **cours**, et la **preuve** précède la **validation**.

## Learnova vs LMS traditionnel

Comparaison d’orientation produit, sans généraliser à tous les LMS. Learnova vise à compléter les LMS, bibliothèques, systèmes d’identité et infrastructures existants ; leur remplacement n’est pas une condition d’adoption.

| LMS traditionnel | Learnova |
|------------------|----------|
| « Quel cours voulez-vous ? » | « Quel objectif voulez-vous atteindre ? » |
| Catalogue centré contenu | Itinéraire centré destination |
| Progression = consommation | Progression = avancement sur un chemin |
| Complétion = terminé | Complétion = preuve + règles métier |
| Parcours figé ou choisi manuellement | Parcours généré et adapté à l’objectif |
| Compétences souvent décoratives | Compétences structurantes du parcours |
| IA optionnelle, peu explainable | IA assistive, règles domaine décisionnelles |

## Principe fondateur : Goal before Content

Aucune activité d’apprentissage n’est proposée sans être **justifiée par un objectif** et **rattachée à une compétence** sur un chemin explicite.

Conséquences :

- L’apprenant voit d’abord sa **destination**, pas une liste de modules.
- Chaque étape répond à la question : « Pourquoi cela me rapproche-t-il de mon objectif ? »
- Le contenu est un **moyen**, jamais le point de départ du produit.

## Chaîne Learning Intelligence

Learnova organise l’expérience autour de cette chaîne :

```
Goal
  → Competency requirements
  → Skills
  → Skill gap / Learner state
  → Learning Path
  → Content & Learning Activities
  → Evidence
  → Assessment
  → Mastery / Progression (dimensions distinctes)
  → Adaptation
  → Measurable outcomes / Impact
```

### Goal (Objectif)

Expression de la destination de l’apprenant : intention, contexte, contraintes (niveau, rythme).

### Skills (Compétences)

Décomposition de l’objectif en capacités observables et vérifiables. Les compétences forment la structure du parcours — pas les cours.

### Learning Path (Parcours)

Itinéraire ordonné (ou partiellement ordonné) d’étapes de compétence menant à l’objectif. Équivalent produit du « GPS des compétences ».

### Learning Activities (Activités)

Micro-learning, exercices, mises en situation, projets — formats variés ancrés dans l’étape courante.

### Evidence (Preuves)

Artefacts démontrant l’apprentissage : réponses de quiz, productions, auto-évaluations, observations. **Aucune validation sans evidence.**

### Mastery (Maîtrise)

Niveau de compétence atteint, distinct de la simple progression. La maîtrise est **évaluée**, pas déduite du temps passé.

### Adaptation

Ajustement du parcours, du rythme, du contenu ou de la remédiation selon les preuves, les lacunes et le profil apprenant.

## Learning Intelligence System

La **cible** Learnova combine :

- **Modèle apprenant** (profil, préférences, historique, lacunes)
- **Graphe de compétences** (relations, prérequis, niveaux)
- **Moteur de parcours** (génération, ordonnancement, adaptation)
- **Moteur d’apprentissage** (contenus, activités, formats)
- **Moteur d’évaluation** (assessment, evidence, mastery)
- **Couche IA assistive** (analyse d’objectifs, tutorat, génération — sous contrainte des règles métier)

L’IA **assiste** ; les **règles du domaine** (seuils, ordre des étapes, validation) **décident**.

## Prototype 0 vs vision

Le Prototype 0 (hackathon, Vite) démontre une **tranche verticale** de cette vision :

`Goal → Learning Path → Learning Activity → Evidence (quiz) → Progress`

Dans ce snapshot UI, **Skills** (graphe), **Mastery** et **Adaptation** sont implicites ou absentes. Le serveur local a depuis ajouté l’identité Skill, les liens Goal/Step, les niveaux requis et l’attribution Evidence↔Skill. Trusted-scoring Slices 1–3 sont **CURRENT** et validés localement (`ae6e5a6`) : scorer pur, persistance quiz/provenance et soumission HTTP de confiance avec rejet legacy sur Step avec clé. La projection Mastery, le SkillGap applicatif et l’Adaptive Path restent non implémentés. Voir le [registre des capacités actuelles](product-positioning.md#current-capability-ledger).

## Orientations stratégiques

- **Skills Intelligence** structure le produit et prolonge les sémantiques acceptées ADR-020–023 ; une inférence ne vaut jamais maîtrise vérifiée.
- **Interopérabilité entreprise — TARGET :** standards d’apprentissage, fédération d’identité et de contenus, échanges avec les LMS via interfaces/adapters. Les protocoles détaillés restent à décider.
- **AI Governance :** autorité du domaine, explicabilité et auditabilité ; politiques institutionnelles, provenance IA et revue humaine sont des exigences cibles, sans nouvelle autorité de scoring ou de maîtrise.
- **Contextualisation africaine — TARGET :** architecture globale, apprentissage contextualisé et forte capacité de contextualisation africaine, configurable selon l’institution, la langue et les contraintes locales. Learnova reste utilisable dans le monde entier.

Ces orientations sont détaillées dans le [positionnement produit](product-positioning.md) ; elles n’autorisent aucune nouvelle implémentation.

## Ambition long terme

Learnova vise une plateforme où chaque apprenant dispose d’un **jumeau d’apprentissage** (*Learning Twin*) : un modèle explicite de ses objectifs, compétences, preuves et prochaines actions optimales — avec des décisions IA **traçables et explainables**.
