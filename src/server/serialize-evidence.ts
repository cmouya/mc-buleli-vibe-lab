import { SERVER_RECALCULATED_PROVENANCE, type Evidence } from "../modules/evidence/index.js"

/** Allowlist learner fields; keep server-derived correctness inside persistence. */
export function serializeEvidence(item: Evidence) {
  return {
    id: item.id,
    learnerId: item.learnerId,
    assessmentId: item.assessmentId,
    stepId: item.stepId,
    type: item.type,
    score: item.score,
    maxScore: item.maxScore,
    passed: item.passed,
    recordedAt: item.recordedAt,
    scoringProvenance: item.scoringProvenance,
    answers: item.answers.map((answer) => ({
      questionIndex: answer.questionIndex,
      selectedIndex: answer.selectedIndex,
      ...(item.scoringProvenance === SERVER_RECALCULATED_PROVENANCE ? {} : { correct: answer.correct }),
    })),
  }
}
