/**
 * Pure quiz assessment logic — testable without DOM.
 * Used by lesson view and unit tests.
 */

export const DEFAULT_PASS_SCORE = 2

/**
 * @param {Array<{ answer: number, explanation?: string, options?: string[], question?: string }>} questions
 * @param {number[]} selectedAnswers — index per question, -1 if unanswered
 * @param {number} passScore
 */
export function evaluateQuizSubmission(questions, selectedAnswers, passScore = DEFAULT_PASS_SCORE) {
  const details = questions.map((item, index) => {
    const selected = selectedAnswers[index] ?? -1
    return {
      index,
      question: item.question,
      options: item.options,
      answer: item.answer,
      explanation: item.explanation,
      selected,
      correct: selected === item.answer,
    }
  })

  const unanswered = details.some((item) => item.selected < 0)
  const score = details.filter((item) => item.correct).length
  const total = questions.length
  const passed = !unanswered && total > 0 && score >= passScore

  return { details, score, total, passed, unanswered }
}

/**
 * @param {{ quiz?: { questions?: unknown[], question?: string, options?: string[], answer?: number, explanation?: string, passScore?: number } }} lesson
 */
export function normalizeQuizQuestions(lesson) {
  if (Array.isArray(lesson.quiz?.questions) && lesson.quiz.questions.length) {
    return lesson.quiz.questions
  }

  if (lesson.quiz?.question) {
    return [
      {
        question: lesson.quiz.question,
        options: lesson.quiz.options,
        answer: lesson.quiz.answer,
        explanation: lesson.quiz.explanation,
      },
    ]
  }

  return []
}
