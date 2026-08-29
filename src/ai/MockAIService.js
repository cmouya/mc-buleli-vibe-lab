import { AIService } from "./AIService.js"

const PATHS = {
  ia: {
    pathId: "ia-pro",
    pathTitle: "IA pour développer votre activité",
    steps: [
      {
        id: "ia-1",
        title: "Comprendre les fondamentaux de l'IA",
        description:
          "Poser les bases : ce qu'un modèle peut faire pour votre activité, et ce qu'il ne remplace pas.",
        level: "Débutant",
        duration: "45 min",
        skill: "Culture IA",
      },
      {
        id: "ia-2",
        title: "Prendre en main ChatGPT",
        description: "Passer d'un usage vague à des échanges structurés, utiles au quotidien.",
        level: "Débutant",
        duration: "50 min",
        skill: "Prise en main ChatGPT",
      },
      {
        id: "ia-3",
        title: "Maîtriser le Prompt Engineering",
        description: "Créer des instructions reproductibles pour vos besoins métier.",
        level: "Intermédiaire",
        duration: "1 h",
        skill: "Prompt engineering",
      },
      {
        id: "ia-4",
        title: "Appliquer l'IA au marketing et à la communication",
        description:
          "Produire offres, posts et messages client à partir de votre objectif d'activité.",
        level: "Intermédiaire",
        duration: "55 min",
        skill: "IA marketing",
      },
      {
        id: "ia-5",
        title: "Automatiser certaines tâches de son activité",
        description: "Identifier les tâches répétitives à accélérer, avec une validation humaine.",
        level: "Intermédiaire",
        duration: "50 min",
        skill: "Automatisation utile",
      },
      {
        id: "ia-6",
        title: "Réaliser un projet pratique",
        description: "Livrer un mini-workflow IA ancré dans un cas réel de votre activité.",
        level: "Intermédiaire",
        duration: "1 h 15",
        skill: "Projet appliqué",
      },
    ],
  },
  data: {
    pathId: "data-analyst",
    pathTitle: "Devenir Data Analyst",
    steps: [
      {
        id: "data-1",
        title: "Penser en données",
        description: "Transformer une question métier en indicateur mesurable.",
        level: "Débutant",
        duration: "40 min",
        skill: "Question métier",
      },
      {
        id: "data-2",
        title: "Tableurs et nettoyage",
        description: "Structurer et fiabiliser un jeu de données simple.",
        level: "Débutant",
        duration: "55 min",
        skill: "Nettoyage de données",
      },
      {
        id: "data-3",
        title: "SQL et requêtes",
        description: "Filtrer, agréger et joindre pour répondre à une question.",
        level: "Intermédiaire",
        duration: "1 h",
        skill: "SQL",
      },
      {
        id: "data-4",
        title: "Visualisation utile",
        description: "Choisir le bon graphique et un titre qui décide.",
        level: "Intermédiaire",
        duration: "45 min",
        skill: "Data viz",
      },
      {
        id: "data-5",
        title: "Projet tableau de bord",
        description: "Construire 3 KPI au service d'une décision.",
        level: "Intermédiaire",
        duration: "1 h 10",
        skill: "Dashboard",
      },
      {
        id: "data-6",
        title: "Évaluation analyste",
        description: "Valider l'enchaînement question → donnée → récit.",
        level: "Intermédiaire",
        duration: "30 min",
        skill: "Récit data",
      },
    ],
  },
  outlook: {
    pathId: "outlook-email-ia",
    pathTitle: "Pilotage d'un projet IA pour la gestion des e-mails Outlook",
    steps: [
      {
        id: "outlook-1",
        title: "Comprendre les usages de l'IA dans la gestion des e-mails",
        description:
          "Cartographier tri, synthèse, priorisation et réponses assistées — et leurs limites pour les cadres.",
        level: "Débutant",
        duration: "45 min",
        skill: "IA et messagerie",
      },
      {
        id: "outlook-2",
        title: "Analyser les processus actuels de traitement des e-mails",
        description:
          "Mesurer volumes, délais de réponse et points de friction dans Outlook avant toute automatisation.",
        level: "Débutant",
        duration: "50 min",
        skill: "Diagnostic e-mail",
      },
      {
        id: "outlook-3",
        title: "Concevoir un workflow intelligent Outlook + IA",
        description:
          "Définir les étapes du parcours e-mail : réception, classification, brouillon, validation, archivage.",
        level: "Intermédiaire",
        duration: "1 h",
        skill: "Workflow Outlook",
      },
      {
        id: "outlook-4",
        title: "Automatiser le tri, la synthèse et la priorisation",
        description:
          "Mettre en place règles, dossiers intelligents et résumés IA pour réduire la charge cognitive.",
        level: "Intermédiaire",
        duration: "55 min",
        skill: "Automatisation e-mail",
      },
      {
        id: "outlook-5",
        title: "Mettre en place des règles de sécurité et de validation humaine",
        description:
          "Gouvernance, confidentialité des données et points de contrôle avant envoi pour les cadres.",
        level: "Intermédiaire",
        duration: "45 min",
        skill: "Gouvernance IA",
      },
      {
        id: "outlook-6",
        title: "Piloter un projet pilote et mesurer les résultats",
        description:
          "Lancer sur un périmètre limité, suivre gains de temps et satisfaction, puis décider du déploiement.",
        level: "Intermédiaire",
        duration: "1 h",
        skill: "Pilotage projet",
      },
    ],
  },
}

const DEMO_MATCHERS = [
  {
    id: "outlook",
    match: (text) =>
      text.includes("outlook") ||
      (text.includes("e-mail") && text.includes("gestion") && text.includes("ia")) ||
      (text.includes("email") && text.includes("gestion") && text.includes("ia")),
    template: () => PATHS.outlook,
  },
  {
    id: "data-analyst",
    match: (text) =>
      text.includes("data analyst") ||
      text.includes("devenir data") ||
      (text.includes("data") && text.includes("analyst")),
    template: () => PATHS.data,
  },
  {
    id: "ia-activite",
    match: (text) =>
      (text.includes("ia") || text.includes("intelligence artificielle")) &&
      (text.includes("activité") ||
        text.includes("activite") ||
        text.includes("business") ||
        text.includes("développer mon activité") ||
        text.includes("developper mon activite")),
    template: () => PATHS.ia,
  },
]

function normalizeGoal(goal) {
  return (goal || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function pickPath(goal) {
  const text = normalizeGoal(goal)

  for (const matcher of DEMO_MATCHERS) {
    if (matcher.match(text)) {
      return matcher.template()
    }
  }

  return buildGenericPath(goal)
}

function buildGenericPath(goal) {
  const topic = extractTopic(goal)
  const slug = slugify(topic).slice(0, 24) || "objectif"
  const pathId = `custom-${slug}`

  return {
    pathId,
    pathTitle: `Parcours : ${topic}`,
    steps: [
      {
        id: `${pathId}-1`,
        title: `Clarifier votre objectif : ${topic}`,
        description: `Décomposer « ${truncate(goal, 90)} » en compétences concrètes et critères de réussite.`,
        level: "Débutant",
        duration: "40 min",
        skill: "Cadrage",
      },
      {
        id: `${pathId}-2`,
        title: `Comprendre les fondamentaux pour ${topic}`,
        description: `Identifier les concepts clés, le vocabulaire et les prérequis liés à votre objectif.`,
        level: "Débutant",
        duration: "45 min",
        skill: "Fondamentaux",
      },
      {
        id: `${pathId}-3`,
        title: `Analyser votre situation actuelle`,
        description: `Faire l'inventaire de vos acquis, contraintes et ressources par rapport à ${topic}.`,
        level: "Débutant",
        duration: "50 min",
        skill: "Diagnostic",
      },
      {
        id: `${pathId}-4`,
        title: `Mettre en pratique les compétences clés`,
        description: `Appliquer une première méthode concrète en lien direct avec ${topic}.`,
        level: "Intermédiaire",
        duration: "55 min",
        skill: "Pratique guidée",
      },
      {
        id: `${pathId}-5`,
        title: `Consolider et corriger`,
        description: `Recevoir du feedback, ajuster votre approche et combler les lacunes identifiées.`,
        level: "Intermédiaire",
        duration: "45 min",
        skill: "Amélioration",
      },
      {
        id: `${pathId}-6`,
        title: `Projet final : ${topic}`,
        description: `Livrer un livrable concret qui démontre votre progression vers votre objectif.`,
        level: "Intermédiaire",
        duration: "1 h",
        skill: "Projet final",
      },
    ],
  }
}

function extractTopic(goal) {
  const cleaned = (goal || "").trim().replace(/[?.!]+$/, "")
  if (!cleaned) {
    return "votre objectif"
  }

  const withoutLead = cleaned
    .replace(/^(je\s+(veux|voudrais|aimerais|souhaite)\s+)/i, "")
    .replace(/^(apprendre\s+(à|a)\s+)/i, "")
    .replace(/^(devenir\s+)/i, "")
    .trim()

  const topic = withoutLead || cleaned
  return truncate(topic, 55)
}

function truncate(value, max) {
  const text = String(value || "").trim()
  if (text.length <= max) {
    return text
  }
  return `${text.slice(0, max - 1).trim()}…`
}

function slugify(value) {
  return normalizeGoal(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockAIService extends AIService {
  async generatePath({ goal, level, hoursPerWeek, intent }) {
    await delay(400)
    const template = pickPath(goal)
    const hoursNote =
      hoursPerWeek >= 8
        ? "Rythme soutenu : vous pouvez enchaîner deux étapes par semaine."
        : hoursPerWeek <= 3
          ? "Rythme léger : une étape par semaine suffit."
          : "Rythme standard : une à deux étapes par semaine."

    return {
      pathId: template.pathId,
      pathTitle: template.pathTitle,
      summary: `${hoursNote} Itinéraire calibré pour un niveau ${level}.`,
      steps: template.steps.map((step) => ({ ...step })),
    }
  }

  async askMentor({ question, lesson }) {
    await delay(350)
    const q = (question || "").trim()
    if (!q) {
      return {
        mode: "demo",
        answer:
          "Posez une question précise sur la leçon : un concept, un exemple, ou comment l'appliquer à votre cas.",
      }
    }

    const title = lesson?.title || "cette étape"
    const points = (lesson?.keyPoints || []).slice(0, 2)
    const tips = points.length
      ? points.map((point, i) => `${i + 1}. ${point}`).join("\n")
      : "1. Relisez l'objectif de l'étape.\n2. Appliquez-le à un cas réel de 10 minutes."

    return {
      mode: "demo",
      answer: `À propos de « ${title} ».\n\nVotre question : ${q}\n\nPistes concrètes :\n${tips}\n\nPour aller plus loin : reformulez l'idée en une action de 15 minutes liée à votre objectif.\n\nQuestion de relance : quel exemple de votre activité voulez-vous traiter en premier ?`,
    }
  }
}
