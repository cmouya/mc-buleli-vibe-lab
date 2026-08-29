/**
 * Contrat du moteur IA.
 * Une implémentation future (OpenAI côté serveur) peut remplacer MockAIService
 * sans changer les vues.
 */
export class AIService {
  async generatePath(_input) {
    throw new Error("generatePath n'est pas implémenté")
  }

  async askMentor(_input) {
    throw new Error("askMentor n'est pas implémenté")
  }
}
