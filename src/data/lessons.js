/**
 * Contenus pédagogiques de démonstration, indexés par id d'étape.
 */
export const lessons = {
  "ia-1": {
    title: "Fondamentaux de l'IA",
    body: "L'intelligence artificielle désigne des systèmes capables d'effectuer des tâches qui demandent d'ordinaire de l'intelligence humaine : classer, prédire, générer du texte ou des images. Pour un usage professionnel, l'essentiel n'est pas de tout comprendre en profondeur, mais de savoir ce qu'un modèle peut (et ne peut pas) faire, et comment formuler un besoin clair.",
    keyPoints: [
      "Un modèle génératif produit du contenu à partir d'un prompt, il ne « sait » pas au sens humain.",
      "La qualité du résultat dépend surtout du contexte que vous fournissez.",
      "L'IA accélère le travail ; elle ne remplace pas votre jugement métier.",
    ],
    quiz: {
      question: "Quelle affirmation décrit le mieux un modèle génératif au travail ?",
      options: [
        "Il décide à votre place sans besoin de contexte.",
        "Il produit du contenu à partir d'instructions et du contexte que vous donnez.",
        "Il remplace entièrement votre expertise métier.",
      ],
      answer: 1,
      explanation: "Le modèle génère une réponse à partir de votre prompt. Sans contexte métier, le résultat reste générique.",
    },
  },
  "ia-2": {
    title: "Utiliser efficacement ChatGPT",
    body: "Un bon usage commence par un rôle, un objectif et un format. Au lieu de demander « aide-moi », précisez qui vous êtes, pour qui vous travaillez, et ce que vous attendez (e-mail, plan, checklist). Itérez : la première réponse sert de brouillon, pas de livrable final.",
    keyPoints: [
      "Donnez un rôle, un public et un format de sortie.",
      "Fournissez 3 à 5 faits métier concrets.",
      "Relancez pour améliorer plutôt que de tout recommencer.",
    ],
    quiz: {
      question: "Quelle pratique améliore le plus une première réponse ?",
      options: [
        "Raccourcir le prompt au maximum.",
        "Préciser rôle, objectif, public et format.",
        "Demander uniquement « sois créatif ».",
      ],
      answer: 1,
      explanation: "Un prompt structuré (rôle, objectif, format) réduit les réponses vagues.",
    },
  },
  "ia-3": {
    title: "Prompt Engineering",
    body: "Le prompt engineering consiste à concevoir des instructions reproductibles. Une structure simple : contexte, tâche, contraintes, critères de qualité, exemple. Pour l'activité professionnelle, créez 3 à 5 prompts réutilisables (offre, e-mail, synthèse client) plutôt que d'improviser à chaque fois.",
    keyPoints: [
      "Séparez contexte, tâche et contraintes.",
      "Ajoutez un exemple de bon résultat.",
      "Industrialisez 3 à 5 prompts métier.",
    ],
    quiz: {
      question: "Pourquoi industrialiser des prompts métier ?",
      options: [
        "Pour éviter d'avoir à relire les réponses.",
        "Pour obtenir des résultats plus stables et plus rapides au quotidien.",
        "Parce que l'IA refuse les prompts improvisés.",
      ],
      answer: 1,
      explanation: "Des prompts réutilisables rendent le travail plus prévisible et plus rapide.",
    },
  },
  "ia-4": {
    title: "IA appliquée au travail",
    body: "Appliquez l'IA à des tâches à fort volume : recherche, premier jet, reformulation, checklist. Conservez une étape humaine pour les décisions sensibles (prix, engagement client, données personnelles). Le bon réflexe : IA pour produire, vous pour valider.",
    keyPoints: [
      "Ciblez les tâches répétitives à fort volume.",
      "Gardez une validation humaine sur les décisions sensibles.",
      "Mesurez le gain : temps gagné, pas volume de texte généré.",
    ],
    quiz: {
      question: "Quelle est la bonne répartition des rôles ?",
      options: [
        "L'IA décide, vous exécutez.",
        "L'IA produit un brouillon, vous validez et décidez.",
        "Vous n'utilisez l'IA que pour les calculs financiers.",
      ],
      answer: 1,
      explanation: "L'IA accélère la production ; votre jugement reste responsable du livrable.",
    },
  },
  "ia-5": {
    title: "Projet pratique",
    body: "Choisissez un cas réel de votre activité (offre commerciale, FAQ, contenu LinkedIn, onboarding client). Construisez un mini-workflow : brief → prompt → brouillon IA → relecture → version finale. Documentez le prompt pour le réutiliser la semaine suivante.",
    keyPoints: [
      "Un projet utile est ancré dans un cas réel.",
      "Le livrable n'est pas le texte brut, c'est le workflow.",
      "Documentez le prompt pour le répéter.",
    ],
    quiz: {
      question: "Quel est le livrable le plus utile d'un projet IA ?",
      options: [
        "Un long texte généré une seule fois.",
        "Un workflow et un prompt réutilisables sur un cas réel.",
        "Une liste d'outils sans cas d'usage.",
      ],
      answer: 1,
      explanation: "Un workflow reproductible crée de la valeur dans le temps, pas un texte unique.",
    },
  },
  "ia-6": {
    title: "Évaluation finale",
    body: "Vérifiez que vous savez : formuler un objectif, structurer un prompt, relire un livrable et choisir où l'IA apporte un gain. L'évaluation n'est pas un diplôme : c'est la preuve que vous pouvez appliquer le GPS des compétences à un prochain objectif.",
    keyPoints: [
      "Vous savez formuler un objectif clair.",
      "Vous savez structurer un prompt métier.",
      "Vous savez valider un livrable avant de l'envoyer.",
    ],
    quiz: {
      question: "Quelle compétence clôture ce parcours ?",
      options: [
        "Savoir citer tous les modèles du marché.",
        "Savoir transformer un besoin métier en prompt, brouillon et validation.",
        "Savoir coder un modèle de zéro.",
      ],
      answer: 1,
      explanation: "Le parcours vise l'usage responsable et efficace, pas la recherche fondamentale.",
    },
  },
  "data-1": {
    title: "Penser en données",
    body: "Un data analyst transforme une question métier en indicateur mesurable. Avant Excel ou Python, clarifiez : quelle décision cette donnée doit-elle éclairer ? Quelle est la population ? Quelle période ?",
    keyPoints: [
      "Toute analyse part d'une question métier.",
      "Définissez l'unité d'analyse (client, commande, jour).",
      "Méfiez-vous des moyennes sans contexte.",
    ],
    quiz: {
      question: "Par quoi commencer une analyse ?",
      options: [
        "Par un graphique complexe.",
        "Par une question métier et une définition d'indicateur.",
        "Par un modèle prédictif.",
      ],
      answer: 1,
      explanation: "Sans question claire, les graphiques n'aident pas à décider.",
    },
  },
  "data-2": {
    title: "Tableurs et nettoyage",
    body: "La majorité du temps d'un analyste est du nettoyage : doublons, dates incohérentes, valeurs manquantes. Un tableur bien structuré (une ligne = une observation, une colonne = une variable) est déjà un avantage compétitif.",
    keyPoints: [
      "Une ligne, une observation.",
      "Nommez les colonnes de façon stable.",
      "Documentez les règles de nettoyage.",
    ],
    quiz: {
      question: "Quelle structure de tableau est la plus fiable ?",
      options: [
        "Des cellules fusionnées pour l'esthétique.",
        "Une observation par ligne, une variable par colonne.",
        "Des couleurs à la place des catégories.",
      ],
      answer: 1,
      explanation: "Le format tabulaire propre est la base de toute analyse reproductible.",
    },
  },
  "data-3": {
    title: "SQL et requêtes",
    body: "SQL permet de filtrer, agréger et joindre des tables. Commencez par SELECT, WHERE, GROUP BY. Une bonne requête répond à une question, pas à « toutes les colonnes ».",
    keyPoints: [
      "Filtrez avant d'agréger.",
      "GROUP BY suit la question métier.",
      "Joignez seulement les tables nécessaires.",
    ],
    quiz: {
      question: "À quoi sert surtout GROUP BY ?",
      options: [
        "À trier alphabétiquement.",
        "À calculer un indicateur par segment (ex. par mois, par client).",
        "À supprimer les doublons visuels.",
      ],
      answer: 1,
      explanation: "GROUP BY agrège des mesures selon une dimension métier.",
    },
  },
  "data-4": {
    title: "Visualisation utile",
    body: "Un graphique n'est pas une décoration. Choisissez le type selon la question : tendance (ligne), comparaison (barres), composition (parts). Un titre doit affirmer un constat, pas seulement nommer l'axe.",
    keyPoints: [
      "Le type de graphique suit la question.",
      "Un titre raconte le constat.",
      "Moins d'encre, plus de message.",
    ],
    quiz: {
      question: "Quel titre de graphique est le plus utile ?",
      options: [
        "Graphique 1",
        "Les ventes du T2 dépassent le T1 de 18 % grâce aux abonnements",
        "Données ventes",
      ],
      answer: 1,
      explanation: "Un titre affirmatif aide le décideur à retenir le message.",
    },
  },
  "data-5": {
    title: "Projet tableau de bord",
    body: "Construisez un mini-dashboard autour de 3 indicateurs (volume, qualité, revenu ou satisfaction). Chaque indicateur a une définition, une source et un propriétaire. Un dashboard sans décision associée reste un rapport.",
    keyPoints: [
      "Trois indicateurs valent mieux que trente.",
      "Chaque KPI a une définition écrite.",
      "Le dashboard sert une décision récurrente.",
    ],
    quiz: {
      question: "Pourquoi limiter le nombre d'indicateurs ?",
      options: [
        "Parce que les outils l'imposent.",
        "Pour concentrer l'attention sur les décisions qui comptent.",
        "Pour éviter d'utiliser SQL.",
      ],
      answer: 1,
      explanation: "Trop d'indicateurs diluent l'action.",
    },
  },
  "data-6": {
    title: "Évaluation analyste",
    body: "Vous savez poser une question, nettoyer un jeu simple, agréger et raconter. La suite naturelle : automatiser, puis modéliser. Le GPS des compétences peut ensuite viser Python ou la data visualisation avancée.",
    keyPoints: [
      "Question → donnée → indicateur → récit.",
      "La qualité des données précède le modèle.",
      "Un analyste convainc par la clarté, pas par le jargon.",
    ],
    quiz: {
      question: "Quel enchaînement décrit le métier d'analyste ?",
      options: [
        "Modèle → données → question.",
        "Question métier → données fiables → indicateur et récit.",
        "Design → publication → collecte.",
      ],
      answer: 1,
      explanation: "L'analyse part du besoin de décision, pas de l'outil.",
    },
  },
  "biz-1": {
    title: "Clarifier l'offre",
    body: "Une entreprise commence par une promesse claire : à qui vous rendez service, quel problème vous retirez, pourquoi vous plutôt qu'un autre. Sans cette phrase, le marketing et le produit s'éparpillent.",
    keyPoints: [
      "Cible + problème + promesse.",
      "Une offre floue coûte cher en acquisition.",
      "Testez la phrase sur 5 personnes hors de votre entourage.",
    ],
    quiz: {
      question: "Que doit contenir une offre claire ?",
      options: [
        "Un logo et un slogan amusant.",
        "Une cible, un problème et une promesse de résultat.",
        "Un business plan de 40 pages.",
      ],
      answer: 1,
      explanation: "L'offre se résume à qui, quel problème, quelle promesse.",
    },
  },
  "biz-2": {
    title: "Client et proposition de valeur",
    body: "Interviewez de vrais prospects. Distinguez ce qu'ils disent vouloir et ce pour quoi ils paient déjà du temps ou de l'argent. La proposition de valeur relie un gain concret à un prix défendable.",
    keyPoints: [
      "Parlez à des clients avant de construire trop.",
      "Observez les solutions actuelles, même imparfaites.",
      "Le prix doit coller au gain perçu.",
    ],
    quiz: {
      question: "Quel signal est le plus fiable ?",
      options: [
        "Un compliment d'un ami.",
        "Du temps ou de l'argent déjà dépensé sur le problème.",
        "Le nombre de likes sur une maquette.",
      ],
      answer: 1,
      explanation: "Le comportement (temps, argent) révèle la douleur réelle.",
    },
  },
  "biz-3": {
    title: "Offre minimale testable",
    body: "Un MVP n'est pas un produit incomplet au hasard : c'est la plus petite version qui permet d'apprendre. Vendez d'abord le résultat, livrez ensuite avec des outils simples. L'apprentissage client précède l'échelle.",
    keyPoints: [
      "Apprendre vite vaut mieux que tout coder.",
      "Vendez le résultat, pas la stack technique.",
      "Mesurez un seul indicateur d'apprentissage.",
    ],
    quiz: {
      question: "À quoi sert un MVP ?",
      options: [
        "À impressionner un jury par la technique.",
        "À tester une hypothèse auprès de vrais utilisateurs.",
        "À éviter tout contact client.",
      ],
      answer: 1,
      explanation: "Le MVP réduit le risque en confrontant l'offre au marché.",
    },
  },
  "biz-4": {
    title: "Premiers clients",
    body: "Les premiers clients viennent souvent du réseau, des communautés et d'un message direct. Un script simple : problème observé, preuve, appel à un échange. Suivez chaque conversation dans un tableau.",
    keyPoints: [
      "Un message personnalisé bat une pub générique au début.",
      "Suivez relances et objections.",
      "Demandez des introductions, pas seulement des likes.",
    ],
    quiz: {
      question: "Quelle action convertit le mieux au démarrage ?",
      options: [
        "Une campagne nationale.",
        "Des conversations ciblées et un suivi structuré.",
        "Un site de 20 pages sans offre.",
      ],
      answer: 1,
      explanation: "Au début, le canal le plus rentable est la conversation directe.",
    },
  },
  "biz-5": {
    title: "Pilotage simple",
    body: "Suivez 3 chiffres : pipeline (conversations), conversion (clients), trésorerie. Un rituel hebdomadaire de 30 minutes suffit pour un fondateur solo. Sans rituel, l'intuition remplace le GPS.",
    keyPoints: [
      "Pipeline, conversion, cash.",
      "Un rituel court et régulier.",
      "Décidez une action par chiffre rouge.",
    ],
    quiz: {
      question: "Pourquoi un rituel hebdomadaire ?",
      options: [
        "Pour remplir un dossier administratif.",
        "Pour transformer des chiffres en une décision concrète.",
        "Pour remplacer les clients.",
      ],
      answer: 1,
      explanation: "Le pilotage n'a de valeur que s'il produit une action.",
    },
  },
  "biz-6": {
    title: "Évaluation entrepreneur",
    body: "Vous savez formuler une offre, parler à un client, tester petit et suivre 3 indicateurs. La suite peut être le pricing, l'acquisition ou l'équipe — un nouvel objectif pour Learnova.",
    keyPoints: [
      "Offre claire.",
      "Preuve client.",
      "Pilotage minimal.",
    ],
    quiz: {
      question: "Quel trio résume ce parcours ?",
      options: [
        "Logo, levée de fonds, open space.",
        "Offre, clients, pilotage.",
        "Code, serveurs, brevets.",
      ],
      answer: 1,
      explanation: "L'essentiel d'un démarrage tient à l'offre, aux clients et au suivi.",
    },
  },
  "en-1": {
    title: "Anglais professionnel : bases",
    body: "L'anglais pro n'exige pas la perfection littéraire. Il exige clarté, politesse et structure. Un e-mail efficace : contexte, demande, délai, remerciement. Des phrases courtes réduisent les malentendus.",
    keyPoints: [
      "Clarté > sophistication.",
      "Une idée par phrase.",
      "Toujours un call-to-action explicite.",
    ],
    quiz: {
      question: "Quelle qualité prime dans un e-mail professionnel ?",
      options: [
        "Des expressions idiomatiques rares.",
        "Une demande claire, un contexte et un délai.",
        "Un paragraphe unique très long.",
      ],
      answer: 1,
      explanation: "Le destinataire doit savoir quoi faire, pour quand.",
    },
  },
  "en-2": {
    title: "E-mails et messages",
    body: "Modèles utiles : follow-up, demande de créneau, recap de réunion. Conservez un ton professionnel mais humain. Évitez le jargon inutile. Relisez à voix haute : si c'est lourd à dire, c'est lourd à lire.",
    keyPoints: [
      "Sujet explicite.",
      "Paragraphes courts.",
      "Relance polie après 3 à 5 jours.",
    ],
    quiz: {
      question: "Que doit contenir l'objet d'un e-mail ?",
      options: [
        "Un emoji uniquement.",
        "Le sujet et, si possible, l'action attendue.",
        "Votre nom complet répété.",
      ],
      answer: 1,
      explanation: "L'objet aide le destinataire à prioriser.",
    },
  },
  "en-3": {
    title: "Réunions et prise de parole",
    body: "En réunion, structurez : point, preuve, proposition. Répétez les acronymes la première fois. Pour une présentation courte : message, 3 arguments, prochaine étape. Le silence après une question est un outil, pas un échec.",
    keyPoints: [
      "Message → arguments → next step.",
      "Reformulez pour vérifier l'accord.",
      "Préparez 3 phrases clés, pas un discours.",
    ],
    quiz: {
      question: "Quelle structure aide le plus à l'oral ?",
      options: [
        "Improviser du début à la fin.",
        "Un message, trois arguments, une prochaine étape.",
        "Lire un texte mot à mot sans pause.",
      ],
      answer: 1,
      explanation: "Une structure simple se mémorise et se suit.",
    },
  },
  "en-4": {
    title: "Vocabulaire métier",
    body: "Construisez un lexique de 30 mots de votre secteur (livraison, budget, délai, risque, indicateur). Apprenez-les en collocations : meet a deadline, raise a risk, share an update. Le vocabulaire utile est celui de vos réunions, pas celui d'un roman.",
    keyPoints: [
      "Lexique ancré dans votre métier.",
      "Apprenez des collocations, pas des listes isolées.",
      "Réutilisez-les dans de vrais e-mails.",
    ],
    quiz: {
      question: "Comment mémoriser du vocabulaire utile ?",
      options: [
        "Avec des mots rares hors contexte.",
        "En collocations liées à vos tâches réelles.",
        "En traduisant mot à mot chaque phrase française.",
      ],
      answer: 1,
      explanation: "Les collocations métier se réutilisent immédiatement.",
    },
  },
  "en-5": {
    title: "Mise en pratique",
    body: "Rédigez un e-mail réel (même si vous ne l'envoyez pas encore), un recap de réunion et une phrase d'introduction en visio. Faites relire par un collègue ou le Mentor Learnova. La régularité de 20 minutes vaut mieux qu'une session mensuelle.",
    keyPoints: [
      "Produisez des textes réels.",
      "Faites relire.",
      "Petite pratique fréquente.",
    ],
    quiz: {
      question: "Quelle pratique progresse le plus vite ?",
      options: [
        "Regarder des séries sans jamais écrire.",
        "Produire et faire relire de vrais messages professionnels.",
        "Apprendre la grammaire sans contexte.",
      ],
      answer: 1,
      explanation: "La production guidée ancre l'anglais dans le travail réel.",
    },
  },
  "en-6": {
    title: "Évaluation anglais pro",
    body: "Vous avez des modèles d'e-mails, une structure orale et un lexique métier. Le prochain objectif peut être la négociation, le storytelling ou les présentations investisseurs — un nouveau GPS.",
    keyPoints: [
      "Clarté écrite.",
      "Structure orale.",
      "Vocabulaire utile.",
    ],
    quiz: {
      question: "Quel résultat attend-on de ce parcours ?",
      options: [
        "Un accent parfait.",
        "Des messages et prises de parole clairs dans un contexte pro.",
        "La lecture de Shakespeare.",
      ],
      answer: 1,
      explanation: "L'objectif est l'efficacité professionnelle, pas la littérature.",
    },
  },
  "outlook-1": {
    title: "Comprendre les usages de l'IA dans la gestion des e-mails",
    introduction:
      "Pour piloter un projet d'optimisation e-mail avec l'IA, il faut d'abord distinguer ce que l'IA peut accélérer (tri, synthèse, brouillons) de ce qui doit rester sous contrôle humain (engagement, confidentialité, décisions sensibles). Cette étape pose le cadre pour un déploiement utile dans Outlook.",
    keyConcepts: [
      {
        title: "Assistance, pas remplacement",
        description:
          "L'IA aide à trier, résumer et pré-rédiger — le cadre valide, ajuste et envoie. Le jugement métier reste central.",
      },
      {
        title: "Usages à fort impact",
        description:
          "Priorisation, synthèse de fils longs, extraction d'actions et brouillons structurés réduisent la charge cognitive sur les boîtes à fort volume.",
      },
      {
        title: "Contraintes entreprise",
        description:
          "Confidentialité, conformité et traçabilité imposent des règles avant toute automatisation dans Outlook.",
      },
    ],
    example: {
      title: "Cas pratique — boîte de réception d'un cadre",
      body:
        "Marie, directrice commerciale, reçoit 90 e-mails par jour dans Outlook. Un assistant IA propose : (1) un résumé matinal des fils prioritaires, (2) un tri par urgence/client, (3) un brouillon pour les relances standards. Marie relit chaque brouillon avant envoi et garde la main sur les négociations sensibles. Gain mesuré : 45 minutes par jour, sans perte de contrôle.",
    },
    takeaway:
      "L'IA dans Outlook vise à libérer du temps de décision, pas à supprimer la responsabilité du cadre. Cartographiez d'abord les usages utiles, puis les garde-fous.",
    quiz: {
      passScore: 2,
      questions: [
        {
          question:
            "Un cadre reçoit 80 e-mails par jour. Quel usage de l'IA répond à la surcharge cognitive sans supprimer son jugement sur les réponses sensibles ?",
          options: [
            "Envoyer automatiquement toutes les réponses sans relecture.",
            "Proposer un tri et des synthèses pour faciliter la revue avant action.",
            "Supprimer définitivement les e-mails jugés non prioritaires.",
          ],
          answer: 1,
          explanation:
            "Le tri et la synthèse assistent la décision ; le cadre garde la validation sur les messages sensibles.",
        },
        {
          question:
            "Avant de déployer l'IA sur les workflows e-mail Outlook en entreprise, que faut-il évaluer en premier ?",
          options: [
            "Le thème visuel par défaut d'Outlook.",
            "Les processus actuels, volumes et points de friction du traitement des e-mails.",
            "Si le modèle peut rédiger des poèmes.",
          ],
          answer: 1,
          explanation:
            "Sans diagnostic des processus et volumes, on automatise au hasard — ou on rate les vrais gains.",
        },
        {
          question:
            "Quand un outil IA rédige des brouillons d'e-mails pour des cadres, quel principe de gouvernance est indispensable ?",
          options: [
            "Ne jamais montrer les brouillons à l'utilisateur.",
            "Validation humaine avant envoi des communications sensibles.",
            "Partager tout le contenu des e-mails avec des services externes sans restriction.",
          ],
          answer: 1,
          explanation:
            "La validation humaine protège la confidentialité, la conformité et la qualité des engagements pris.",
        },
      ],
    },
  },
}

export function getLesson(stepId) {
  return lessons[stepId] || null
}

export function buildFallbackLesson(step) {
  if (!step) {
    return null
  }

  return {
    title: step.title,
    introduction: step.description,
    keyConcepts: [
      {
        title: "Objectif de l'étape",
        description: step.description,
      },
      {
        title: "Compétence visée",
        description: `Développer : ${step.skill || "compétence associée à votre destination"}.`,
      },
      {
        title: "Mise en pratique",
        description: "Reliez chaque concept à un cas concret de votre activité avant de valider le quiz.",
      },
    ],
    example: {
      title: "Application",
      body: `Appliquez cette étape à votre objectif : ${step.title.toLowerCase()}.`,
    },
    takeaway: "Validez votre compréhension via le quiz avant de passer à l'étape suivante.",
    quiz: {
      passScore: 2,
      questions: [
        {
          question: `Quel est l'objectif principal de l'étape « ${step.title} » ?`,
          options: [
            "Terminer le parcours sans comprendre le contenu.",
            step.description,
            "Ignorer la compétence associée.",
          ],
          answer: 1,
          explanation: "L'étape vise exactement ce résultat, ancré dans votre itinéraire.",
        },
        {
          question: "Quelle compétence cette étape contribue-t-elle à développer ?",
          options: [
            step.skill || "Compétence de l'étape",
            "Aucune compétence spécifique",
            "Uniquement la mémorisation de titres",
          ],
          answer: 0,
          explanation: "Chaque étape du GPS Learnova correspond à une compétence mesurable.",
        },
        {
          question: "Quand pouvez-vous passer à l'étape suivante ?",
          options: [
            "Dès l'ouverture de la page, sans quiz.",
            "Après avoir démontré votre compréhension via le quiz de validation.",
            "Uniquement si vous recommencez tout le parcours.",
          ],
          answer: 1,
          explanation: "Learnova met à jour la progression selon la validation démontrée.",
        },
      ],
    },
  }
}
