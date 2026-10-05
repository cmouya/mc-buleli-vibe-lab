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
    "outlook-2": {
      title: "Analyser les processus actuels de traitement des e-mails",
      introduction: "Avant d'automatiser Outlook, observez comment les e-mails sont reçus, triés, traités et suivis. Cette analyse permet de choisir un premier périmètre utile et de mesurer son effet.",
      keyConcepts: [
        { title: "Cartographier le flux", description: "Décrivez le parcours d'un e-mail : réception, lecture, qualification, réponse, escalade et archivage." },
        { title: "Mesurer les irritants", description: "Suivez les volumes, délais, relances, interruptions et catégories qui demandent le plus d'attention." },
        { title: "Choisir un périmètre pilote", description: "Commencez par un cas fréquent et peu sensible, pour lequel un gain peut être constaté." },
      ],
      example: { title: "Cas pratique — demandes clients", body: "Une équipe reçoit 300 demandes clients par semaine. Elle constate que les demandes de suivi de commande sont nombreuses, répétitives et retardent les demandes urgentes. Elle choisit ce flux pour un premier pilote de tri et de brouillon assistés." },
      takeaway: "Un diagnostic concret évite d'automatiser au hasard : partez des volumes, des délais et des points de friction observés.",
      quiz: { passScore: 2, questions: [
        { question: "Quelle information est la plus utile avant d'automatiser un flux d'e-mails ?", options: ["La couleur préférée des utilisateurs.", "Les volumes, délais et points de friction du flux actuel.", "Le nombre de signatures e-mail disponibles."], answer: 1, explanation: "Ces données montrent où une automatisation peut apporter un bénéfice mesurable." },
        { question: "Quel flux convient le mieux à un premier pilote ?", options: ["Un cas fréquent, peu sensible et facile à mesurer.", "La négociation la plus sensible de l'entreprise.", "Tous les e-mails de l'organisation en même temps."], answer: 0, explanation: "Un pilote limité réduit le risque et facilite l'apprentissage." },
        { question: "Pourquoi cartographier le parcours d'un e-mail ?", options: ["Pour supprimer toute intervention humaine.", "Pour repérer les étapes, responsabilités et retards à améliorer.", "Pour remplacer les règles de confidentialité."], answer: 1, explanation: "La cartographie rend visibles les points où le traitement ralentit ou se répète." },
      ] },
    },
    "outlook-3": {
      title: "Concevoir un workflow intelligent Outlook + IA",
      introduction: "Un workflow efficace répartit clairement ce que fait l'IA et ce que valide la personne responsable. Il relie réception, classification, préparation de brouillon, revue et archivage.",
      keyConcepts: [
        { title: "Définir les étapes", description: "Décrivez les déclencheurs, entrées, décisions et sorties de chaque étape du flux." },
        { title: "Rendre les rôles explicites", description: "L'IA peut proposer une catégorie ou un brouillon ; une personne conserve les décisions et l'envoi." },
        { title: "Prévoir les exceptions", description: "Les messages sensibles, ambigus ou incomplets doivent rejoindre une file de revue humaine." },
      ],
      example: { title: "Cas pratique — boîte partagée", body: "Dans une boîte partagée, Outlook classe les demandes par thème. L'IA prépare un résumé et un brouillon pour les demandes standard. Les demandes juridiques ou urgentes sont étiquetées pour une revue immédiate par le responsable." },
      takeaway: "Un bon workflow ne masque pas les décisions : il accélère les tâches répétitives et rend les contrôles humains visibles.",
      quiz: { passScore: 2, questions: [
        { question: "Quel rôle convient à l'IA dans un workflow Outlook ?", options: ["Envoyer seule les messages sensibles.", "Proposer une classification, un résumé ou un brouillon à revoir.", "Décider des engagements contractuels."], answer: 1, explanation: "L'IA assiste les étapes répétitives ; la revue humaine reste nécessaire pour les décisions." },
        { question: "Que faut-il faire des e-mails ambigus ou sensibles ?", options: ["Les envoyer dans une file de revue humaine.", "Les supprimer automatiquement.", "Les traiter sans règle particulière."], answer: 0, explanation: "Les exceptions doivent être dirigées vers une personne compétente." },
        { question: "Pourquoi définir les déclencheurs et sorties du workflow ?", options: ["Pour allonger le processus.", "Pour savoir quand le flux démarre, ce qu'il produit et qui intervient.", "Pour éviter de mesurer le pilote."], answer: 1, explanation: "Des étapes explicites permettent de tester et d'améliorer le workflow." },
      ] },
    },
    "outlook-4": {
      title: "Automatiser le tri, la synthèse et la priorisation",
      introduction: "Après le diagnostic et la conception du flux, automatisez des tâches ciblées : classer les messages, résumer les fils longs et mettre en avant les actions urgentes. Vérifiez toujours les résultats avant un usage large.",
      keyConcepts: [
        { title: "Règles de tri", description: "Utilisez des critères compréhensibles, tels que l'expéditeur, le sujet, le client ou le niveau d'urgence." },
        { title: "Synthèses utiles", description: "Une bonne synthèse indique le contexte, les décisions attendues et les prochaines actions." },
        { title: "Priorisation contrôlée", description: "Les suggestions de priorité soutiennent la décision ; elles ne remplacent pas le jugement métier." },
      ],
      example: { title: "Cas pratique — revue du matin", body: "Chaque matin, un cadre reçoit une synthèse des fils actifs, les trois actions à traiter et les messages dont le délai de réponse approche. Il vérifie les priorités avant d'attribuer les actions à son équipe." },
      takeaway: "Automatisez des tâches observables, puis contrôlez la qualité des tris et synthèses avec les utilisateurs concernés.",
      quiz: { passScore: 2, questions: [
        { question: "Quel résultat doit contenir une synthèse utile d'un fil e-mail ?", options: ["Seulement le nom de l'expéditeur.", "Le contexte, les décisions attendues et les prochaines actions.", "Une copie complète de chaque message."], answer: 1, explanation: "Une synthèse utile permet de décider rapidement quoi faire ensuite." },
        { question: "Comment utiliser une suggestion de priorité produite par l'IA ?", options: ["Comme une aide à la décision à vérifier.", "Comme une décision définitive sans revue.", "Comme un motif pour supprimer le message."], answer: 0, explanation: "La priorité proposée doit rester sous contrôle de la personne responsable." },
        { question: "Quel critère peut guider une règle de tri ?", options: ["L'humeur du jour.", "L'expéditeur, le client ou l'urgence indiquée.", "La longueur aléatoire de l'e-mail."], answer: 1, explanation: "Des critères explicites rendent le tri plus prévisible et vérifiable." },
      ] },
    },
    "outlook-5": {
      title: "Mettre en place des règles de sécurité et de validation humaine",
      introduction: "L'automatisation des e-mails doit protéger les informations, respecter les règles de l'organisation et préserver une validation humaine pour les situations à risque. Définissez ces garde-fous avant le déploiement.",
      keyConcepts: [
        { title: "Classer les informations", description: "Identifiez les données confidentielles, personnelles et sensibles qui demandent un traitement renforcé." },
        { title: "Définir les validations", description: "Précisez quels messages exigent une revue humaine avant partage, réponse ou envoi." },
        { title: "Conserver une trace", description: "Documentez les règles, les exceptions et les décisions pour pouvoir les revoir et les améliorer." },
      ],
      example: { title: "Cas pratique — message externe", body: "Un brouillon destiné à un partenaire externe contient des données de projet. Le workflow l'identifie comme sensible, bloque l'envoi automatique et demande la validation du responsable avant toute transmission." },
      takeaway: "Les garde-fous transforment une automatisation en pratique responsable : protégez les données, prévoyez la revue et tracez les exceptions.",
      quiz: { passScore: 2, questions: [
        { question: "Quel message doit être soumis à une validation humaine avant envoi ?", options: ["Toute notification système sans contenu.", "Un message contenant des données sensibles ou un engagement externe.", "Aucun message, car l'automatisation suffit."], answer: 1, explanation: "Les communications sensibles exigent une revue avant d'être envoyées." },
        { question: "Pourquoi documenter les règles et exceptions du workflow ?", options: ["Pour pouvoir contrôler, expliquer et améliorer les décisions.", "Pour rendre le workflow plus difficile à utiliser.", "Pour éviter toute responsabilité humaine."], answer: 0, explanation: "La documentation apporte traçabilité et amélioration continue." },
        { question: "Quelle première étape aide à protéger les données ?", options: ["Partager tous les e-mails avec n'importe quel outil.", "Identifier les informations confidentielles et les traitements autorisés.", "Retirer les contrôles de sécurité."], answer: 1, explanation: "La classification des informations permet d'appliquer les bonnes protections." },
      ] },
    },
    "outlook-6": {
      title: "Piloter un projet pilote et mesurer les résultats",
      introduction: "Un pilote permet de tester le workflow sur un périmètre limité avant de l'étendre. Définissez une population, une durée, des indicateurs et une décision de suite fondée sur les résultats.",
      keyConcepts: [
        { title: "Fixer un périmètre", description: "Choisissez une équipe, un type de message et une période de test clairement délimités." },
        { title: "Mesurer les effets", description: "Suivez le temps gagné, les délais de réponse, la qualité perçue et les incidents observés." },
        { title: "Décider avec les résultats", description: "Comparez les résultats au point de départ et décidez d'ajuster, d'étendre ou d'arrêter le pilote." },
      ],
      example: { title: "Cas pratique — pilote de six semaines", body: "Une équipe de support teste le tri et les brouillons assistés pendant six semaines sur les demandes de suivi. Elle mesure le délai moyen, le temps consacré au tri et les retours des agents. Le comité décide ensuite quelles règles étendre." },
      takeaway: "Un pilote réussi produit des éléments de décision : un périmètre clair, des mesures simples et une revue honnête des résultats.",
      quiz: { passScore: 2, questions: [
        { question: "Quel élément définit un pilote utile ?", options: ["Un déploiement immédiat à toute l'organisation.", "Un périmètre limité, une durée et des indicateurs mesurables.", "Une promesse de gain sans mesure."], answer: 1, explanation: "Un périmètre et des indicateurs permettent d'évaluer le pilote de façon crédible." },
        { question: "Quel indicateur peut mesurer l'effet du workflow ?", options: ["Le temps de traitement et le délai de réponse.", "La couleur de l'interface Outlook.", "Le nombre de réunions sans lien avec le pilote."], answer: 0, explanation: "Les délais et le temps de traitement sont liés aux objectifs du workflow." },
        { question: "Que faire après la période pilote ?", options: ["Ignorer les résultats et étendre automatiquement.", "Comparer les résultats, recueillir les retours et décider de la suite.", "Supprimer toutes les données de mesure."], answer: 1, explanation: "La décision d'étendre ou d'ajuster doit s'appuyer sur les résultats observés." },
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
    "outlook-2": {
      title: "Analyse current email handling processes",
      introduction: "Before automating Outlook, observe how emails are received, sorted, handled, and followed up. This analysis helps select a useful first scope and measure its effect.",
      keyConcepts: [
        { title: "Map the flow", description: "Describe an email's journey: receipt, reading, qualification, response, escalation, and archiving." },
        { title: "Measure friction", description: "Track volumes, response times, follow-ups, interruptions, and the categories that require the most attention." },
        { title: "Choose a pilot scope", description: "Start with a frequent, low-risk case where a benefit can be observed." },
      ],
      example: { title: "Practical case — customer requests", body: "A team receives 300 customer requests each week. It finds that order-status requests are frequent and repetitive, delaying urgent cases. The team selects this flow for an initial pilot of assisted sorting and drafting." },
      takeaway: "A concrete diagnosis avoids arbitrary automation: start with observed volumes, delays, and friction points.",
      quiz: { passScore: 2, questions: [
        { question: "Which information is most useful before automating an email flow?", options: ["Users' favourite colour.", "The current flow's volumes, delays, and friction points.", "The number of available email signatures."], answer: 1, explanation: "This information shows where automation can produce a measurable benefit." },
        { question: "Which flow is best suited to an initial pilot?", options: ["A frequent, low-risk case that is easy to measure.", "The organisation's most sensitive negotiation.", "Every email in the organisation at once."], answer: 0, explanation: "A limited pilot reduces risk and makes learning easier." },
        { question: "Why map an email's journey?", options: ["To remove every human intervention.", "To identify steps, responsibilities, and delays to improve.", "To replace confidentiality rules."], answer: 1, explanation: "Mapping reveals where handling slows down or repeats." },
      ] },
    },
    "outlook-3": {
      title: "Design an intelligent Outlook and AI workflow",
      introduction: "An effective workflow clearly separates what AI does from what the responsible person validates. It connects intake, classification, draft preparation, review, and archiving.",
      keyConcepts: [
        { title: "Define the steps", description: "Describe the triggers, inputs, decisions, and outputs for every part of the flow." },
        { title: "Make roles explicit", description: "AI can propose a category or draft; a person retains decisions and sending authority." },
        { title: "Plan for exceptions", description: "Sensitive, ambiguous, or incomplete messages should enter a human-review queue." },
      ],
      example: { title: "Practical case — shared inbox", body: "In a shared inbox, Outlook classifies requests by topic. AI prepares a summary and draft for standard requests. Legal or urgent requests are labelled for immediate review by the responsible manager." },
      takeaway: "A good workflow does not hide decisions: it accelerates repeatable work and makes human controls visible.",
      quiz: { passScore: 2, questions: [
        { question: "Which role suits AI in an Outlook workflow?", options: ["Sending sensitive messages on its own.", "Proposing a classification, summary, or draft for review.", "Deciding contractual commitments."], answer: 1, explanation: "AI supports repeatable steps; human review remains necessary for decisions." },
        { question: "What should happen to ambiguous or sensitive emails?", options: ["Send them to a human-review queue.", "Delete them automatically.", "Process them without a specific rule."], answer: 0, explanation: "Exceptions should be directed to a qualified person." },
        { question: "Why define workflow triggers and outputs?", options: ["To make the process longer.", "To know when the flow starts, what it produces, and who intervenes.", "To avoid measuring the pilot."], answer: 1, explanation: "Explicit steps make the workflow easier to test and improve." },
      ] },
    },
    "outlook-4": {
      title: "Automate sorting, summarisation, and prioritisation",
      introduction: "After diagnosing and designing the flow, automate focused tasks: classify messages, summarise long threads, and surface urgent actions. Always verify results before broader use.",
      keyConcepts: [
        { title: "Sorting rules", description: "Use understandable criteria such as sender, subject, client, or urgency." },
        { title: "Useful summaries", description: "A good summary states the context, expected decisions, and next actions." },
        { title: "Controlled prioritisation", description: "Priority suggestions support decisions; they do not replace professional judgement." },
      ],
      example: { title: "Practical case — morning review", body: "Each morning, a manager receives a summary of active threads, the three actions requiring attention, and messages nearing their response deadline. The manager checks priorities before assigning actions to the team." },
      takeaway: "Automate observable tasks, then check the quality of sorting and summaries with the people who use them.",
      quiz: { passScore: 2, questions: [
        { question: "What should a useful email-thread summary contain?", options: ["Only the sender's name.", "Context, expected decisions, and next actions.", "A full copy of every message."], answer: 1, explanation: "A useful summary makes it easier to decide what to do next." },
        { question: "How should an AI-generated priority suggestion be used?", options: ["As decision support to be checked.", "As a final decision without review.", "As a reason to delete the message."], answer: 0, explanation: "A responsible person must retain control over the proposed priority." },
        { question: "Which criterion can guide a sorting rule?", options: ["The mood of the day.", "The sender, client, or indicated urgency.", "The email's random length."], answer: 1, explanation: "Explicit criteria make sorting more predictable and verifiable." },
      ] },
    },
    "outlook-5": {
      title: "Set security rules and human review points",
      introduction: "Email automation must protect information, respect organisational rules, and preserve human validation for higher-risk situations. Define these safeguards before deployment.",
      keyConcepts: [
        { title: "Classify information", description: "Identify confidential, personal, and sensitive data that require stronger handling." },
        { title: "Define reviews", description: "Specify which messages require a person's review before sharing, replying, or sending." },
        { title: "Keep a record", description: "Document rules, exceptions, and decisions so they can be reviewed and improved." },
      ],
      example: { title: "Practical case — external message", body: "A draft for an external partner contains project data. The workflow identifies it as sensitive, blocks automatic sending, and asks the responsible manager for approval before transmission." },
      takeaway: "Safeguards turn automation into responsible practice: protect data, plan review, and record exceptions.",
      quiz: { passScore: 2, questions: [
        { question: "Which message should receive human validation before it is sent?", options: ["Any system notification with no content.", "A message containing sensitive data or an external commitment.", "No message, because automation is sufficient."], answer: 1, explanation: "Sensitive communications require review before they are sent." },
        { question: "Why document workflow rules and exceptions?", options: ["To control, explain, and improve decisions.", "To make the workflow harder to use.", "To remove all human responsibility."], answer: 0, explanation: "Documentation supports traceability and continuous improvement." },
        { question: "Which first step helps protect data?", options: ["Share every email with any tool.", "Identify confidential information and authorised processing.", "Remove security controls."], answer: 1, explanation: "Classifying information makes it possible to apply suitable protection." },
      ] },
    },
    "outlook-6": {
      title: "Lead a pilot and measure its results",
      introduction: "A pilot tests the workflow on a limited scope before it is expanded. Define a population, duration, indicators, and a follow-up decision based on the results.",
      keyConcepts: [
        { title: "Set the scope", description: "Choose a team, message type, and testing period with clear boundaries." },
        { title: "Measure effects", description: "Track time saved, response times, perceived quality, and observed incidents." },
        { title: "Decide from results", description: "Compare results with the starting point and decide whether to adjust, expand, or stop the pilot." },
      ],
      example: { title: "Practical case — six-week pilot", body: "A support team tests assisted sorting and drafting for six weeks on follow-up requests. It measures average response time, time spent sorting, and agent feedback. The steering group then decides which rules to extend." },
      takeaway: "A successful pilot produces decision evidence: a clear scope, simple measures, and an honest review of results.",
      quiz: { passScore: 2, questions: [
        { question: "What defines a useful pilot?", options: ["Immediate rollout to the whole organisation.", "A limited scope, a duration, and measurable indicators.", "A promise of benefit without measurement."], answer: 1, explanation: "Scope and indicators make it possible to assess the pilot credibly." },
        { question: "Which indicator can measure the workflow's effect?", options: ["Handling time and response time.", "The colour of the Outlook interface.", "The number of meetings unrelated to the pilot."], answer: 0, explanation: "Response and handling times are connected to the workflow's objectives." },
        { question: "What should happen after the pilot period?", options: ["Ignore the results and expand automatically.", "Compare results, collect feedback, and decide what follows.", "Delete all measurement data."], answer: 1, explanation: "The decision to expand or adjust should rely on observed results." },
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
