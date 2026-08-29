import { MockAIService } from "./MockAIService.js"

/**
 * Point unique d'accès au moteur IA.
 * Aujourd'hui : MockAIService (démonstration locale).
 * Demain : remplacer par un client qui appelle un backend (OpenAI côté serveur).
 */
export function getAIService() {
  return new MockAIService()
}
