export const OUTLOOK_PATH_ID = "outlook-email-ia"

const OUTLOOK_PATHS = {
  fr: {
    pathTitle: "Pilotage d'un projet IA pour la gestion des e-mails Outlook",
    steps: [
      { id: "outlook-1", title: "Comprendre les usages de l'IA dans la gestion des e-mails", description: "Cartographier tri, synthèse, priorisation et réponses assistées — et leurs limites pour les cadres.", level: "Débutant", duration: "45 min", skill: "IA et messagerie" },
      { id: "outlook-2", title: "Analyser les processus actuels de traitement des e-mails", description: "Mesurer volumes, délais de réponse et points de friction dans Outlook avant toute automatisation.", level: "Débutant", duration: "50 min", skill: "Diagnostic e-mail" },
      { id: "outlook-3", title: "Concevoir un workflow intelligent Outlook + IA", description: "Définir les étapes du parcours e-mail : réception, classification, brouillon, validation, archivage.", level: "Intermédiaire", duration: "1 h", skill: "Workflow Outlook" },
      { id: "outlook-4", title: "Automatiser le tri, la synthèse et la priorisation", description: "Mettre en place règles, dossiers intelligents et résumés IA pour réduire la charge cognitive.", level: "Intermédiaire", duration: "55 min", skill: "Automatisation e-mail" },
      { id: "outlook-5", title: "Mettre en place des règles de sécurité et de validation humaine", description: "Gouvernance, confidentialité des données et points de contrôle avant envoi pour les cadres.", level: "Intermédiaire", duration: "45 min", skill: "Gouvernance IA" },
      { id: "outlook-6", title: "Piloter un projet pilote et mesurer les résultats", description: "Lancer sur un périmètre limité, suivre gains de temps et satisfaction, puis décider du déploiement.", level: "Intermédiaire", duration: "1 h", skill: "Pilotage projet" },
    ],
  },
  en: {
    pathTitle: "Leading an AI project for Outlook email management",
    steps: [
      { id: "outlook-1", title: "Understand how AI can support email management", description: "Map sorting, summarisation, prioritisation, and assisted replies — along with their limits for managers.", level: "Beginner", duration: "45 min", skill: "AI and email" },
      { id: "outlook-2", title: "Analyse current email handling processes", description: "Measure volumes, response times, and friction points in Outlook before automating anything.", level: "Beginner", duration: "50 min", skill: "Email diagnostics" },
      { id: "outlook-3", title: "Design an intelligent Outlook and AI workflow", description: "Define the email journey: intake, classification, draft, review, and archiving.", level: "Intermediate", duration: "1 h", skill: "Outlook workflow" },
      { id: "outlook-4", title: "Automate sorting, summarisation, and prioritisation", description: "Set up rules, smart folders, and AI summaries to reduce cognitive load.", level: "Intermediate", duration: "55 min", skill: "Email automation" },
      { id: "outlook-5", title: "Set security rules and human review points", description: "Set governance, data confidentiality, and review points before messages are sent.", level: "Intermediate", duration: "45 min", skill: "AI governance" },
      { id: "outlook-6", title: "Lead a pilot and measure its results", description: "Start with a limited scope, track time saved and satisfaction, then decide whether to expand.", level: "Intermediate", duration: "1 h", skill: "Project leadership" },
    ],
  },
}

const OUTLOOK_LESSONS = {
  fr: {
    "outlook-1": {
      title: "Comprendre les usages de l'IA dans la gestion des e-mails",
      introduction: "Pour piloter un projet d'optimisation e-mail avec l'IA, il faut d'abord distinguer ce que l'IA peut accélérer (tri, synthèse, brouillons) de ce qui doit rester sous contrôle humain (engagement, confidentialité, décisions sensibles). Cette étape pose le cadre pour un déploiement utile dans Outlook.",
      keyConcepts: [
        { title: "Assistance, pas remplacement", description: "L'IA aide à trier, résumer et pré-rédiger — le cadre valide, ajuste et envoie. Le jugement métier reste central." },
        { title: "Usages à fort impact", description: "Priorisation, synthèse de fils longs, extraction d'actions et brouillons structurés réduisent la charge cognitive sur les boîtes à fort volume." },
        { title: "Contraintes entreprise", description: "Confidentialité, conformité et traçabilité imposent des règles avant toute automatisation dans Outlook." },
      ],
      example: { title: "Cas pratique — boîte de réception d'un cadre", body: "Marie, directrice commerciale, reçoit 90 e-mails par jour dans Outlook. Un assistant IA propose : (1) un résumé matinal des fils prioritaires, (2) un tri par urgence/client, (3) un brouillon pour les relances standards. Marie relit chaque brouillon avant envoi et garde la main sur les négociations sensibles. Gain mesuré : 45 minutes par jour, sans perte de contrôle." },
      takeaway: "L'IA dans Outlook vise à libérer du temps de décision, pas à supprimer la responsabilité du cadre. Cartographiez d'abord les usages utiles, puis les garde-fous.",
      quiz: { passScore: 2, questions: [
        { question: "Un cadre reçoit 80 e-mails par jour. Quel usage de l'IA répond à la surcharge cognitive sans supprimer son jugement sur les réponses sensibles ?", options: ["Envoyer automatiquement toutes les réponses sans relecture.", "Proposer un tri et des synthèses pour faciliter la revue avant action.", "Supprimer définitivement les e-mails jugés non prioritaires."], answer: 1, explanation: "Le tri et la synthèse assistent la décision ; le cadre garde la validation sur les messages sensibles." },
        { question: "Avant de déployer l'IA sur les workflows e-mail Outlook en entreprise, que faut-il évaluer en premier ?", options: ["Le thème visuel par défaut d'Outlook.", "Les processus actuels, volumes et points de friction du traitement des e-mails.", "Si le modèle peut rédiger des poèmes."], answer: 1, explanation: "Sans diagnostic des processus et volumes, on automatise au hasard — ou on rate les vrais gains." },
        { question: "Quand un outil IA rédige des brouillons d'e-mails pour des cadres, quel principe de gouvernance est indispensable ?", options: ["Ne jamais montrer les brouillons à l'utilisateur.", "Validation humaine avant envoi des communications sensibles.", "Partager tout le contenu des e-mails avec des services externes sans restriction."], answer: 1, explanation: "La validation humaine protège la confidentialité, la conformité et la qualité des engagements pris." },
      ] },
    },
  },
  en: {
    "outlook-1": {
      title: "Understand how AI can support email management",
      introduction: "To lead an AI-enabled email optimisation project, first separate the work AI can accelerate — sorting, summarisation, and drafts — from what must remain under human control: commitments, confidentiality, and sensitive decisions. This step establishes a useful deployment framework for Outlook.",
      keyConcepts: [
        { title: "Assistance, not replacement", description: "AI helps sort, summarise, and prepare drafts; the manager reviews, adjusts, and sends them. Professional judgement remains central." },
        { title: "High-impact uses", description: "Prioritisation, long-thread summaries, action extraction, and structured drafts reduce the cognitive load of high-volume inboxes." },
        { title: "Enterprise constraints", description: "Confidentiality, compliance, and traceability require clear rules before Outlook workflows are automated." },
      ],
      example: { title: "Practical case — a manager's inbox", body: "Marie, a sales director, receives 90 emails per day in Outlook. An AI assistant proposes: (1) a morning summary of priority threads, (2) sorting by urgency and client, and (3) a draft for standard follow-ups. Marie reviews every draft before sending and remains responsible for sensitive negotiations. Measured benefit: 45 minutes saved each day without losing control." },
      takeaway: "AI in Outlook should free time for decisions, not remove a manager's responsibility. First map the useful uses, then define the safeguards.",
      quiz: { passScore: 2, questions: [
        { question: "A manager receives 80 emails a day. Which AI use addresses cognitive overload without removing their judgement over sensitive replies?", options: ["Send every reply automatically without review.", "Offer sorting and summaries to support review before action.", "Permanently delete emails considered low priority."], answer: 1, explanation: "Sorting and summaries support decision-making; the manager keeps review authority over sensitive messages." },
        { question: "Before deploying AI in enterprise Outlook email workflows, what should be assessed first?", options: ["Outlook's default visual theme.", "Current processes, volumes, and friction points in email handling.", "Whether the model can write poems."], answer: 1, explanation: "Without a diagnosis of processes and volumes, automation is arbitrary and may miss the real gains." },
        { question: "When an AI tool drafts emails for managers, which governance principle is essential?", options: ["Never show drafts to the user.", "Human review before sensitive communications are sent.", "Share all email content with external services without restriction."], answer: 1, explanation: "Human review protects confidentiality, compliance, and the quality of commitments." },
      ] },
    },
  },
}

function variant(language) {
  return language === "en" ? "en" : "fr"
}

export function getOutlookPathTemplate(language = "fr") {
  const content = OUTLOOK_PATHS[variant(language)]
  return { pathId: OUTLOOK_PATH_ID, pathTitle: content.pathTitle, steps: content.steps.map((step) => ({ ...step })) }
}

export function resolvePathPresentation({ pathId, pathTitle, steps }, language = "fr") {
  if (pathId !== OUTLOOK_PATH_ID) return { pathTitle, steps }
  const content = OUTLOOK_PATHS[variant(language)]
  const byId = new Map(content.steps.map((step) => [step.id, step]))
  return {
    pathTitle: content.pathTitle,
    steps: steps.map((step) => ({ ...step, ...(byId.get(step.id) || {}) })),
  }
}

export function getOutlookLesson(pathId, stepId, language = "fr") {
  if (pathId !== OUTLOOK_PATH_ID) return null
  return OUTLOOK_LESSONS[variant(language)][stepId] || null
}
